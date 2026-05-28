function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeView(view = 'unified') {
  return view === 'split' ? 'split' : 'unified'
}

function toFileEntries(files = {}) {
  if (Array.isArray(files)) {
    return files
      .map((item) => ({
        path: item?.path || item?.name || '',
        content: String(item?.content ?? item?.text ?? ''),
      }))
      .filter((item) => item.path)
  }
  return Object.entries(files).map(([path, content]) => ({
    path,
    content: String(content ?? ''),
  }))
}

function toFileMap(files = {}) {
  return new Map(toFileEntries(files).map((item) => [item.path, item.content]))
}

function toLines(content = '') {
  return String(content).split('\n')
}

function createMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

function diffLines(before = '', after = '') {
  const oldLines = toLines(before)
  const newLines = toLines(after)
  const dp = createMatrix(oldLines.length + 1, newLines.length + 1)

  for (let i = oldLines.length - 1; i >= 0; i -= 1) {
    for (let j = newLines.length - 1; j >= 0; j -= 1) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  const lines = []
  let i = 0
  let j = 0
  let oldNumber = 1
  let newNumber = 1

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      lines.push({
        type: 'context',
        content: oldLines[i],
        oldNumber,
        newNumber,
      })
      i += 1
      j += 1
      oldNumber += 1
      newNumber += 1
      continue
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({
        type: 'remove',
        content: oldLines[i],
        oldNumber,
        newNumber: null,
      })
      i += 1
      oldNumber += 1
      continue
    }

    lines.push({
      type: 'add',
      content: newLines[j],
      oldNumber: null,
      newNumber,
    })
    j += 1
    newNumber += 1
  }

  while (i < oldLines.length) {
    lines.push({
      type: 'remove',
      content: oldLines[i],
      oldNumber,
      newNumber: null,
    })
    i += 1
    oldNumber += 1
  }

  while (j < newLines.length) {
    lines.push({
      type: 'add',
      content: newLines[j],
      oldNumber: null,
      newNumber,
    })
    j += 1
    newNumber += 1
  }

  return lines
}

function buildSplitRows(lines = []) {
  const rows = []
  let index = 0

  while (index < lines.length) {
    const current = lines[index]
    if (current.type === 'context') {
      rows.push({ left: current, right: current })
      index += 1
      continue
    }

    if (current.type === 'remove') {
      const next = lines[index + 1]
      if (next?.type === 'add') {
        rows.push({ left: current, right: next })
        index += 2
        continue
      }
      rows.push({ left: current, right: null })
      index += 1
      continue
    }

    rows.push({ left: null, right: current })
    index += 1
  }

  return rows
}

function hasChange(lines = []) {
  return lines.some((line) => line.type !== 'context')
}

function formatSignedCount(count = 0) {
  return `${count >= 0 ? '+' : ''}${count}`
}

function formatCount(value = 0) {
  return Number.isFinite(value) ? String(value) : '0'
}

export function buildDiffModel({
  baselineFiles = {},
  currentFiles = {},
  view = 'unified',
} = {}) {
  const baselineMap = toFileMap(baselineFiles)
  const currentMap = toFileMap(currentFiles)
  const paths = Array.from(new Set([...baselineMap.keys(), ...currentMap.keys()])).sort((left, right) =>
    left.localeCompare(right, 'zh-CN'),
  )

  let totalAdded = 0
  let totalRemoved = 0

  const files = paths
    .map((path) => {
      const lines = diffLines(baselineMap.get(path) || '', currentMap.get(path) || '')
      if (!hasChange(lines)) return null

      const stats = lines.reduce(
        (summary, line) => {
          if (line.type === 'add') summary.added += 1
          if (line.type === 'remove') summary.removed += 1
          return summary
        },
        { added: 0, removed: 0 },
      )

      totalAdded += stats.added
      totalRemoved += stats.removed

      return {
        path,
        lines,
        splitRows: buildSplitRows(lines),
        stats,
      }
    })
    .filter(Boolean)

  return {
    view: normalizeView(view),
    empty: files.length === 0,
    files,
    stats: {
      added: totalAdded,
      removed: totalRemoved,
      files: files.length,
    },
  }
}

function formatTime(ts) {
  const date = new Date(ts ?? Date.now())
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function parseLocation(text = '') {
  const match = String(text).match(/([\w./-]+\.[\w]+):(\d+)(?::(\d+))?/)
  if (!match) return null
  return {
    file: match[1],
    line: Number(match[2]),
    column: match[3] ? Number(match[3]) : null,
  }
}

function normalizeConsoleLevel(level = 'log') {
  if (level === 'warn') return 'warn'
  if (level === 'error') return 'error'
  if (level === 'ai') return 'ai'
  return 'log'
}

function consoleLevelLabel(level = 'log') {
  if (level === 'warn') return 'WARN'
  if (level === 'error') return 'ERR'
  if (level === 'ai') return 'AI'
  return 'LOG'
}

function readConsoleText(raw = {}) {
  if (raw.text) return String(raw.text)
  if (Array.isArray(raw.args)) return raw.args.map((item) => String(item)).join(' ')
  return String(raw.message ?? '')
}

export function normalizeConsoleEntry(raw = {}) {
  const level = normalizeConsoleLevel(raw.level)
  const text = readConsoleText(raw)
  const location = raw.location || parseLocation(text)

  return {
    id: raw.id || `console-${Math.random().toString(36).slice(2, 10)}`,
    level,
    levelLabel: consoleLevelLabel(level),
    text,
    timestamp: raw.ts ?? raw.timestamp ?? raw.createdAt ?? Date.now(),
    timeLabel: raw.timeLabel || formatTime(raw.ts ?? raw.timestamp ?? raw.createdAt ?? Date.now()),
    location,
    actionLabel: raw.actionLabel || (level === 'ai' ? '一键修复' : ''),
  }
}

export function buildConsoleModel({ entries = [], filter = 'all' } = {}) {
  const normalizedEntries = entries.map(normalizeConsoleEntry)
  const normalizedFilter = filter === 'log' || filter === 'warn' || filter === 'error' ? filter : 'all'
  const filteredEntries = normalizedEntries.filter((entry) => {
    if (normalizedFilter === 'all') return true
    if (normalizedFilter === 'error') return entry.level === 'error' || entry.level === 'ai'
    return entry.level === normalizedFilter
  })

  const stats = normalizedEntries.reduce(
    (summary, entry) => {
      if (entry.level === 'log' || entry.level === 'warn' || entry.level === 'error') {
        summary.total += 1
      }
      if (entry.level === 'warn') summary.warn += 1
      if (entry.level === 'error') summary.error += 1
      return summary
    },
    { total: 0, warn: 0, error: 0 },
  )

  return {
    filter: normalizedFilter,
    empty: filteredEntries.length === 0,
    entries: normalizedEntries,
    filteredEntries,
    stats,
  }
}

function renderDiffLineNumber(value) {
  return value == null ? '' : formatCount(value)
}

function renderUnifiedLine(file, line, options = {}) {
  const meta = options.resolveLineMeta?.({ file, line, side: 'unified' }) || null
  const extraClass = meta?.className ? ` ${meta.className}` : ''
  const badge = meta?.badge ? `<span class="rw-diff__line-badge">${escapeHtml(meta.badge)}</span>` : ''

  return `
    <div class="rw-diff__line rw-diff__line--${line.type}${extraClass}">
      <span class="rw-diff__line-no">${renderDiffLineNumber(line.oldNumber)}</span>
      <span class="rw-diff__line-no">${renderDiffLineNumber(line.newNumber)}</span>
      <span class="rw-diff__line-mark">${line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}</span>
      <span class="rw-diff__line-text">${escapeHtml(line.content)}</span>
      ${badge}
    </div>
  `
}

function renderSplitCell(file, line, side, options = {}) {
  if (!line) {
    return '<div class="rw-diff__split-cell rw-diff__split-cell--empty"></div>'
  }

  const meta = options.resolveLineMeta?.({ file, line, side }) || null
  const extraClass = meta?.className ? ` ${meta.className}` : ''
  const badge = meta?.badge ? `<span class="rw-diff__line-badge">${escapeHtml(meta.badge)}</span>` : ''

  return `
    <div class="rw-diff__split-cell rw-diff__split-cell--${line.type}${extraClass}">
      <span class="rw-diff__line-no">${escapeHtml(renderDiffLineNumber(side === 'left' ? line.oldNumber : line.newNumber))}</span>
      <span class="rw-diff__line-text">${escapeHtml(line.content)}</span>
      ${badge}
    </div>
  `
}

function renderDiffFile(file, view, options = {}) {
  const body =
    view === 'split'
      ? `
        <div class="rw-diff__split">
          ${file.splitRows
            .map(
              (row) => `
                <div class="rw-diff__split-row">
                  ${renderSplitCell(file, row.left, 'left', options)}
                  ${renderSplitCell(file, row.right, 'right', options)}
                </div>
              `,
            )
            .join('')}
        </div>
      `
      : `
        <div class="rw-diff__unified">
          ${file.lines.map((line) => renderUnifiedLine(file, line, options)).join('')}
        </div>
      `

  return `
    <section class="rw-diff__file" data-path="${escapeHtml(file.path)}">
      <header class="rw-diff__file-head">
        <span class="rw-diff__file-path">${escapeHtml(file.path)}</span>
        <span class="rw-diff__file-stats">${formatSignedCount(file.stats.added)} ${formatSignedCount(-file.stats.removed)}</span>
      </header>
      ${body}
    </section>
  `
}

export function renderRuntimeDiffWindow(container, model = buildDiffModel(), options = {}) {
  if (!container) return
  const view = normalizeView(model?.view)
  const files = Array.isArray(model?.files) ? model.files : []
  const stats = model?.stats || { added: 0, removed: 0, files: 0 }

  container.innerHTML = `
    <section class="rw-diff" data-view="${view}">
      <header class="rw-diff__toolbar">
        <div class="rw-diff__view-switch">
          <button class="rw-diff__view-btn" data-view="unified" aria-pressed="${view === 'unified' ? 'true' : 'false'}">unified</button>
          <button class="rw-diff__view-btn" data-view="split" aria-pressed="${view === 'split' ? 'true' : 'false'}">split</button>
        </div>
        <span class="rw-diff__hint">上次运行后的变更</span>
      </header>
      <div class="rw-diff__body">
        ${
          model?.empty || !files.length
            ? '<div class="rw-diff__empty">运行游戏后，代码变更将在这里显示</div>'
            : files.map((file) => renderDiffFile(file, view, options)).join('')
        }
      </div>
      <footer class="rw-diff__footer">${formatSignedCount(stats.added)} 行  ${formatSignedCount(-stats.removed)} 行  ${formatCount(stats.files)} 个文件  上次运行后变更</footer>
    </section>
  `
}

function renderConsoleJump(entry) {
  if (!entry.location) return ''
  const label = `${entry.location.file}:${entry.location.line}`
  return `<button class="rw-console__jump" data-action="jump-to-error" data-file="${escapeHtml(entry.location.file)}" data-line="${escapeHtml(entry.location.line)}" data-column="${escapeHtml(entry.location.column ?? '')}" aria-label="跳转到 ${escapeHtml(label)}">跳转</button>`
}

function renderConsoleRow(entry) {
  if (entry.level === 'ai') {
    return `
      <article class="rw-console__row rw-console__row--ai" data-entry-id="${escapeHtml(entry.id)}">
        <div class="rw-console__row-head">
          <span class="rw-console__time">${escapeHtml(entry.timeLabel)}</span>
          <span class="rw-console__level">${entry.levelLabel}</span>
        </div>
        <div class="rw-console__message">${escapeHtml(entry.text)}</div>
        ${entry.actionLabel ? `<button class="rw-console__fix" data-action="apply-ai-fix" data-entry-id="${escapeHtml(entry.id)}">${escapeHtml(entry.actionLabel)}</button>` : ''}
      </article>
    `
  }

  return `
    <article class="rw-console__row rw-console__row--${entry.level}" data-entry-id="${escapeHtml(entry.id)}">
      <span class="rw-console__time">${escapeHtml(entry.timeLabel)}</span>
      <span class="rw-console__level">${entry.levelLabel}</span>
      <span class="rw-console__message">${escapeHtml(entry.text)}</span>
      ${entry.level === 'error' ? renderConsoleJump(entry) : ''}
    </article>
  `
}

export function renderRuntimeConsoleWindow(container, model = buildConsoleModel()) {
  if (!container) return
  const filter = model?.filter || 'all'
  const entries = Array.isArray(model?.filteredEntries) ? model.filteredEntries : []
  const allEntries = Array.isArray(model?.entries) ? model.entries : []
  const stats = model?.stats || { warn: 0, error: 0 }

  container.innerHTML = `
    <section class="rw-console" data-filter="${escapeHtml(filter)}">
      <header class="rw-console__toolbar">
        <button class="rw-console__clear" data-action="clear-console">清除</button>
        <select class="rw-console__filter" name="console-filter">
          <option value="all"${filter === 'all' ? ' selected' : ''}>ALL</option>
          <option value="log"${filter === 'log' ? ' selected' : ''}>LOG</option>
          <option value="warn"${filter === 'warn' ? ' selected' : ''}>WARN</option>
          <option value="error"${filter === 'error' ? ' selected' : ''}>ERR</option>
        </select>
      </header>
      <div class="rw-console__body">
        ${
          model?.empty || !entries.length
            ? '<div class="rw-console__empty">运行游戏后，控制台输出将在这里显示</div>'
            : entries.map(renderConsoleRow).join('')
        }
      </div>
      <footer class="rw-console__footer">${formatCount(allEntries.length)} 条日志  ${formatCount(stats.warn)} 警告  ${formatCount(stats.error)} 错误</footer>
    </section>
  `
}
