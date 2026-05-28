import 'dotenv/config'
import express from 'express'
import compression from 'compression'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import http from 'http'
import https from 'https'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'
import { choosePreferredBase, collectLanIPv4Addresses } from './network-utils.js'
import { listenWithFallback } from './server-startup.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const server = http.createServer(app)

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'
const VERSION = 'X1'
const DEFAULT_API_BASE = (process.env.AICLAUDE_API_BASE || 'https://api.moonshot.cn/v1').replace(/\/+$/, '')
const DEFAULT_MODEL = 'kimi-k2.5'
const API_KEY = process.env.AICLAUDE_API_KEY || ''
const startTime = Date.now()
let lastApiCall = { time: null, status: null, model: null }

// ── Keep-alive agent for upstream connections ──
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 10,
  timeout: 60000
})

// ── Colored logging ──
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
}

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function log(color, prefix, msg) {
  console.log(`${C.dim}[${ts()}]${C.reset} ${color}${prefix}${C.reset} ${msg}`)
}

if (!API_KEY) {
  log(C.yellow, '⚠', 'No AICLAUDE_API_KEY in .env — will use key from browser settings')
}

// ── Middleware ──
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  }
}))

// ── URL resolution ──
function resolveApiBase(raw) {
  if (typeof raw !== 'string') return DEFAULT_API_BASE
  let trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_API_BASE

  // Auto-migrate known old domains
  trimmed = trimmed.replace('api.moonshot.ai', 'api.moonshot.cn')

  // Remove accidental /chat/completions suffix
  trimmed = trimmed.replace(/\/chat\/completions\/?$/, '')

  if (!/^https?:\/\//i.test(trimmed)) return DEFAULT_API_BASE
  return trimmed
}

// ── Request body sanitization ──
function sanitizeBody(body) {
  const clean = { ...body }
  delete clean.apiBase
  delete clean.apiKey

  // Normalize model
  if (clean.model) {
    clean.model = String(clean.model).trim()
  } else {
    clean.model = DEFAULT_MODEL
  }

  // Clamp temperature
  if (clean.temperature !== undefined) {
    const t = Number(clean.temperature)
    clean.temperature = Number.isFinite(t) ? Math.max(0, Math.min(2, t)) : 0.7
  }

  // Clamp max_tokens
  if (clean.max_tokens !== undefined) {
    const m = Number(clean.max_tokens)
    clean.max_tokens = Number.isFinite(m) ? Math.max(100, Math.min(32000, m)) : 4096
  }

  // Extract timeout hint from client (ms) — don't forward to upstream API
  if (clean.timeout_hint !== undefined) {
    const t = Number(clean.timeout_hint)
    clean._timeoutMs = Number.isFinite(t) ? Math.max(30000, Math.min(600000, t)) : 120000
    delete clean.timeout_hint
  } else {
    clean._timeoutMs = 120000
  }

  // Clean messages
  if (Array.isArray(clean.messages)) {
    clean.messages = clean.messages.filter(m => m && m.role && m.content)
    if (clean.messages.length === 0) return null
  } else {
    return null
  }

  // Remove null/undefined fields
  for (const key of Object.keys(clean)) {
    if (clean[key] === null || clean[key] === undefined) delete clean[key]
  }

  return clean
}

// ── Error classification ──
function classifyError(status, errorText) {
  const errors = {
    400: { type: 'model_error', suggestion: '请求参数有误，请检查模型名称和消息格式' },
    401: { type: 'auth_error', suggestion: 'API 密钥无效或已过期，请在设置中更新密钥' },
    403: { type: 'auth_error', suggestion: 'API 密钥权限不足或账户已被限制' },
    404: { type: 'model_error', suggestion: '模型不存在或 API 地址错误，请检查设置' },
    429: { type: 'rate_limit', suggestion: '请求过于频繁，请稍后再试' },
    500: { type: 'upstream_error', suggestion: 'API 服务内部错误，请稍后重试' },
    502: { type: 'upstream_error', suggestion: 'API 服务暂时不可用，请稍后重试' },
    503: { type: 'upstream_error', suggestion: 'API 服务正在维护，请稍后重试' },
    504: { type: 'timeout', suggestion: 'API 服务响应超时，请稍后重试' },
  }
  const info = errors[status] || { type: 'upstream_error', suggestion: '未知错误，请检查 API 设置或稍后重试' }

  let message = errorText
  try {
    const parsed = JSON.parse(errorText)
    message = parsed?.error?.message || parsed?.message || errorText
  } catch { /* keep raw text */ }

  return { type: info.type, message, status, suggestion: info.suggestion }
}

// ── Retry logic for non-streaming ──
const RETRYABLE = new Set([429, 500, 502, 503, 504])
const MAX_RETRIES = 2
const BACKOFF = [1000, 3000]

async function fetchWithRetry(url, options, attempt = 0) {
  const res = await fetch(url, options)
  if (!res.ok && RETRYABLE.has(res.status) && attempt < MAX_RETRIES) {
    const delay = BACKOFF[attempt] || 3000
    log(C.yellow, '↻', `Retry ${attempt + 1}/${MAX_RETRIES} after ${res.status}, waiting ${delay}ms`)
    await new Promise(r => setTimeout(r, delay))
    return fetchWithRetry(url, options, attempt + 1)
  }
  return res
}

// ── Main API proxy ──
app.post('/api/chat', async (req, res) => {
  const reqStart = Date.now()
  const apiBase = resolveApiBase(req.body?.apiBase)
  const key = req.body?.apiKey || API_KEY
  const isStream = req.body?.stream === true
  const model = req.body?.model || DEFAULT_MODEL

  // Validate API key
  if (!key) {
    log(C.red, '✗', 'No API key provided')
    return res.status(401).json({
      error: {
        type: 'auth_error',
        message: '未配置 API 密钥',
        status: 401,
        suggestion: '请在右上角「设置」中填入 API 密钥，或在 .env 文件中配置 AICLAUDE_API_KEY'
      }
    })
  }

  // Sanitize request body
  const cleanBody = sanitizeBody(req.body)
  if (!cleanBody) {
    log(C.red, '✗', 'Invalid request body (empty messages)')
    return res.status(400).json({
      error: {
        type: 'model_error',
        message: '请求消息为空',
        status: 400,
        suggestion: '请确保发送了有效的消息内容'
      }
    })
  }

  const upstreamUrl = `${apiBase}/chat/completions`
  const totalTimeoutMs = cleanBody._timeoutMs || 120000
  delete cleanBody._timeoutMs
  log(C.cyan, '→', `POST /api/chat model=${model} stream=${isStream} timeout=${totalTimeoutMs/1000}s key=${key ? key.slice(0, 8) + '...' : 'EMPTY'}`)
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Connection': 'keep-alive'
    },
    body: JSON.stringify(cleanBody)
  }

  try {
    if (isStream) {
      // ── Streaming request ──
      const controller = new AbortController()
      fetchOptions.signal = controller.signal

      // 30s timeout for first response (some models think longer)
      const firstChunkTimer = setTimeout(() => controller.abort(), 30000)
      // Per-request total timeout (default 120s, up to 600s for large generation)
      const totalTimer = setTimeout(() => controller.abort(), totalTimeoutMs)

      let upstream
      try {
        upstream = await fetch(upstreamUrl, fetchOptions)
      } catch (e) {
        clearTimeout(firstChunkTimer)
        clearTimeout(totalTimer)
        throw e
      }
      clearTimeout(firstChunkTimer)

      if (!upstream.ok) {
        clearTimeout(totalTimer)
        const errText = await upstream.text()
        const errInfo = classifyError(upstream.status, errText)
        log(C.red, '✗', `${upstream.status} ${errInfo.type} ${Date.now() - reqStart}ms`)
        lastApiCall = { time: new Date().toISOString(), status: upstream.status, model }
        return res.status(upstream.status).json({ error: errInfo })
      }

      // Set SSE headers immediately and flush
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no'
      })
      res.flushHeaders()

      log(C.green, '⇄', `Stream started ${Date.now() - reqStart}ms`)
      lastApiCall = { time: new Date().toISOString(), status: 200, model }

      if (upstream.body) {
        const reader = upstream.body.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
        } catch (e) {
          // Stream error — send error event to client
          if (!res.writableEnded) {
            const errMsg = e.name === 'AbortError' ? '请求超时' : '流式传输中断'
            res.write(`data: ${JSON.stringify({ error: { message: errMsg } })}\n\n`)
          }
          log(C.red, '✗', `Stream error: ${e.message} ${Date.now() - reqStart}ms`)
        } finally {
          clearTimeout(totalTimer)
          if (!res.writableEnded) res.end()
          log(C.green, '✓', `Stream ended ${Date.now() - reqStart}ms`)
        }
      } else {
        clearTimeout(totalTimer)
        res.end()
      }

    } else {
      // ── Non-streaming request with retry ──
      const controller = new AbortController()
      fetchOptions.signal = controller.signal
      const timer = setTimeout(() => controller.abort(), 30000)

      let upstream
      try {
        upstream = await fetchWithRetry(upstreamUrl, fetchOptions)
      } finally {
        clearTimeout(timer)
      }

      const text = await upstream.text()
      const elapsed = Date.now() - reqStart
      lastApiCall = { time: new Date().toISOString(), status: upstream.status, model }

      if (upstream.ok) {
        log(C.green, '✓', `${upstream.status} OK ${elapsed}ms`)
      } else {
        const errInfo = classifyError(upstream.status, text)
        log(C.red, '✗', `${upstream.status} ${errInfo.type} ${elapsed}ms`)
        return res.status(upstream.status).json({ error: errInfo })
      }

      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8')
      res.status(upstream.status).send(text)
    }

  } catch (error) {
    const elapsed = Date.now() - reqStart

    if (error.name === 'AbortError') {
      log(C.red, '✗', `Timeout ${elapsed}ms`)
      if (!res.headersSent) {
        return res.status(504).json({
          error: {
            type: 'timeout',
            message: '请求超时',
            status: 504,
            suggestion: '请求超时，可能是网络问题或模型繁忙，请稍后重试'
          }
        })
      }
    } else if (error.cause?.code === 'ECONNREFUSED' || error.cause?.code === 'ENOTFOUND') {
      log(C.red, '✗', `Network error: ${error.cause.code} ${elapsed}ms`)
      if (!res.headersSent) {
        return res.status(502).json({
          error: {
            type: 'network_error',
            message: `无法连接到 API 服务: ${error.cause.code}`,
            status: 502,
            suggestion: '无法连接到 API 服务器，请检查 API 地址是否正确，以及网络连接是否正常'
          }
        })
      }
    } else {
      log(C.red, '✗', `Error: ${error.message} ${elapsed}ms`)
      if (!res.headersSent) {
        return res.status(500).json({
          error: {
            type: 'network_error',
            message: error.message || '代理请求失败',
            status: 500,
            suggestion: '请检查网络连接和 API 设置'
          }
        })
      }
    }

    if (!res.writableEnded) res.end()
  }
})

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: VERSION,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    lastApiCall
  })
})

// ── Default config (no secrets) ──
app.get('/api/config', (_req, res) => {
  res.json({
    defaultApiBase: DEFAULT_API_BASE,
    defaultModel: DEFAULT_MODEL,
    version: VERSION
  })
})

app.get('/api/network', (req, res) => {
  const forwardedProto = req.headers['x-forwarded-proto']
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol
  const hostHeader = req.headers.host || `localhost:${PORT}`
  const url = new URL(`${protocol}://${hostHeader}`)
  const interfaces = os.networkInterfaces()
  const lanAddresses = collectLanIPv4Addresses(interfaces)

  res.json({
    requestOrigin: `${url.protocol}//${url.host}`,
    preferredBase: choosePreferredBase({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port || String(PORT),
      interfaces,
    }),
    lanAddresses,
    port: String(PORT),
  })
})

// ── Routes ──
app.get('/app', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'))
})

app.get('/plan', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'plan.html'))
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ── Start ──
try {
  const { port: activePort, requestedPort, fellBack } = await listenWithFallback(server, {
    host: HOST,
    port: PORT,
    onRetry({ attemptedPort, nextPort }) {
      log(C.yellow, '⚠', `Port ${attemptedPort} is busy, trying ${nextPort}`)
    },
  })

  const wss = new WebSocketServer({ server })
  wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req)
  })

  const interfaces = os.networkInterfaces()
  const lanAddresses = collectLanIPv4Addresses(interfaces)

  if (fellBack) {
    log(C.yellow, '⚠', `Requested port ${requestedPort} was busy, switched to ${activePort}`)
  }

  log(C.cyan, '🚀', `CODELAB X1 running at http://localhost:${activePort}`)
  lanAddresses.forEach(address => {
    log(C.green, '🌐', `LAN access: http://${address}:${activePort}`)
  })
} catch (error) {
  log(C.red, '✗', `Failed to start server: ${error.message}`)
  process.exit(1)
}
