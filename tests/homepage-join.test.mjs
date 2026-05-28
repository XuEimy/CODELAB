import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

const projectRoot = path.resolve(import.meta.dirname, '..')
const indexPath = path.join(projectRoot, 'public', 'index.html')

function loadLandingPage() {
  let html = fs.readFileSync(indexPath, 'utf8')
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/)
  assert.ok(scriptMatch, 'inline landing-page script should exist')

  const script = scriptMatch[1]
  html = html
    .replace(/<script src=[\s\S]*?<\/script>/g, '')
    .replace(/<script>[\s\S]*<\/script>\s*<\/body>/, '</body>')

  const dom = new JSDOM(html, {
    url: 'http://localhost:3000/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  })

  const { window } = dom
  window.alert = () => {}
  window.prompt = () => 'ABC123'
  window.scrollTo = () => {}
  window.requestAnimationFrame = () => 1
  window.cancelAnimationFrame = () => {}
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  })
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.google = { accounts: { id: { initialize() {}, prompt() {} } } }
  window.HTMLCanvasElement.prototype.getContext = () =>
    new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'measureText') return () => ({ width: 0 })
          return () => {}
        },
      },
    )

  window.eval(script)
  return window
}

test('landing page script initializes and exposes join-room actions', () => {
  const window = loadLandingPage()

  assert.equal(typeof window.openJoinEntry, 'function')
  assert.equal(typeof window.quickJoinRoom, 'function')
  assert.equal(typeof window.joinToRoom, 'function')

  window.openJoinEntry()
  assert.equal(window.document.getElementById('lm').classList.contains('open'), true)

  window.document.getElementById('quick-name').value = '测试用户'
  window.document.getElementById('quick-room').value = 'ABC123'

  let captured = null
  window.joinToRoom = (name, room) => {
    captured = { name, room }
    return true
  }

  window.quickJoinRoom()

  assert.deepEqual(captured, { name: '测试用户', room: 'ABC123' })
})
