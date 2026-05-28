function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDurationHM(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDurationMinutes(ms) {
  const minutes = Math.max(1, Math.round(ms / 60000))
  return `${minutes} 分钟`
}

function normalizeJoinTimes(joinTimes) {
  if (joinTimes instanceof Map) return joinTimes
  return new Map(Object.entries(joinTimes || {}))
}

function getHostWindow() {
  if (typeof globalThis !== 'undefined' && globalThis.window) return globalThis.window
  return typeof window !== 'undefined' ? window : null
}

function getSessionStartTime(now, explicitStartTime) {
  if (Number.isFinite(explicitStartTime)) return explicitStartTime
  const hostWindow = getHostWindow()
  const fallbackStartTime = hostWindow?._statsCounters?.startTime
  return Number.isFinite(fallbackStartTime) ? fallbackStartTime : now
}

function buildLeaderboardRows(entries = [], formatter = (value) => String(value)) {
  const sorted = entries
    .filter((entry) => entry && entry.name && Number(entry.value) > 0)
    .sort((a, b) => b.value - a.value || String(a.name).localeCompare(String(b.name), 'zh-Hans-CN'))
    .slice(0, 3)
  const maxValue = sorted[0]?.value || 1

  return sorted.map((entry, index) => ({
    rank: index + 1,
    name: entry.name,
    valueLabel: formatter(entry.value),
    fill: Math.max(18, Math.round((entry.value / maxValue) * 100)),
  }))
}

function buildMetricCards({ users, codeLines, totalRequests, totalRuns }) {
  return [
    { label: '在线协作者', value: users.length, color: 'var(--green)' },
    { label: '代码行数', value: codeLines, color: 'var(--purple)' },
    { label: 'AI 对话', value: totalRequests, color: 'var(--accent)' },
    { label: '预览运行', value: totalRuns, color: 'var(--orange)' },
  ]
}

function buildLeaderboardSection(contributions = []) {
  return {
    title: '贡献排行',
    note: '按代码行数',
    rows: buildLeaderboardRows(contributions, (value) => `${Number(value).toLocaleString()}`),
  }
}

function buildDurationSection(sessionDurationMs) {
  const maxDurationMs = 4 * 60 * 60 * 1000
  return {
    title: '在线时长',
    valueMs: sessionDurationMs,
    valueLabel: formatDurationHM(sessionDurationMs),
    fill: Math.max(0, Math.min(100, Math.round((sessionDurationMs / maxDurationMs) * 100))),
  }
}

function buildOverviewRows(cards) {
  return cards.map((card) => ({ label: card.label, value: String(card.value), tone: card.color }))
}

function buildContributionEntries(contributions = []) {
  return contributions.map((entry) => ({
    name: entry?.name,
    value: Number(entry?.count) || 0,
  }))
}

export function buildPlayerStatsModel({
  now = Date.now(),
  sessionStartTime,
  users = [],
  contributions = [],
  messages = [],
  joinTimes = new Map(),
  tasks = [],
  totalRuns = 0,
  totalRequests = 0,
} = {}) {
  const joinMap = normalizeJoinTimes(joinTimes)
  const validUsers = Array.isArray(users) ? users : []
  const validContributions = Array.isArray(contributions) ? contributions : []
  const validMessages = Array.isArray(messages) ? messages : []
  const validTasks = Array.isArray(tasks) ? tasks : []

  const typingCount = validUsers.filter((user) => user?.typing).length
  const viewingCount = validUsers.filter((user) => user?.viewing).length
  const doneTasks = validTasks.filter((task) => task?.done).length
  const taskLabel = validTasks.length ? `${doneTasks}/${validTasks.length}` : '0/0'

  const chatCounter = new Map()
  validMessages.forEach((message) => {
    const name = message?.name
    if (!name) return
    chatCounter.set(name, (chatCounter.get(name) || 0) + 1)
  })

  const codeLines = validContributions.reduce((sum, contribution) => sum + (Number(contribution?.count) || 0), 0)
  const sessionStart = getSessionStartTime(now, sessionStartTime)
  const sessionDurationMs = Math.max(0, now - sessionStart)

  const cards = buildMetricCards({
    users: validUsers,
    codeLines,
    totalRequests,
    totalRuns,
  })

  const contributionEntries = buildContributionEntries(validContributions)
  const leaderboard = buildLeaderboardSection(contributionEntries)
  const duration = buildDurationSection(sessionDurationMs)

  const durationRows = validUsers.map((user) => ({
    name: user?.name,
    value: Math.max(1, now - (joinMap.get(user?.id) || now)),
  }))

  return {
    title: 'PLAYER STATS',
    overview: buildOverviewRows(cards).concat([
      { label: '正在编辑', value: String(typingCount), tone: 'var(--purple)' },
      { label: '预览中', value: String(viewingCount), tone: 'var(--green)' },
      { label: '任务完成', value: taskLabel, tone: 'var(--gold)' },
    ]),
    cards,
    leaderboards: [leaderboard],
    duration,
    contribRows: leaderboard.rows,
    sessionDuration: sessionDurationMs,
    durationRows: durationRows.map((entry) => ({
      ...entry,
      valueLabel: formatDurationMinutes(entry.value),
    })),
    chatCounts: [...chatCounter.entries()].map(([name, value]) => ({ name, value })),
  }
}

function createFallbackModel() {
  return buildPlayerStatsModel()
}

function ensureCounters() {
  const hostWindow = getHostWindow()
  if (!hostWindow) return { codeLines: 0, aiChats: 0, previewRuns: 0, startTime: Date.now() }
  if (!hostWindow._statsCounters) {
    hostWindow._statsCounters = {
      codeLines: 0,
      aiChats: 0,
      previewRuns: 0,
      startTime: Date.now(),
    }
  }
  return hostWindow._statsCounters
}

function animateNumChange(el, newText) {
  if (!el) return
  const oldText = el.textContent
  el.textContent = newText
  if (oldText !== newText && oldText !== '--') {
    el.classList.remove('ps-card-num--flash')
    void el.offsetWidth
    el.classList.add('ps-card-num--flash')
  }
}

function renderCard(card) {
  return `
    <div class="ps-card">
      <div class="ps-card-num" data-ps-card="value" style="color:${escapeHtml(card.color)}">${escapeHtml(card.value)}</div>
      <div class="ps-card-label">${escapeHtml(card.label)}</div>
    </div>
  `
}

function renderLeaderboardRows(rows = []) {
  if (!rows.length) {
    return '<div class="ps-rank-row" style="justify-content:center;color:var(--textd);font-size:10px">暂无数据</div>'
  }

  return rows
    .map(
      (row) => `
      <div class="ps-rank-row">
        <div class="ps-rank-num">${escapeHtml(row.rank)}</div>
        <div class="ps-rank-name">${escapeHtml(row.name)}</div>
        <div class="ps-rank-bar"><div class="ps-rank-fill" style="width:${escapeHtml(row.fill)}%"></div></div>
        <div class="ps-rank-val">${escapeHtml(row.valueLabel)}</div>
      </div>
    `,
    )
    .join('')
}

function renderStatsShell({ cards, leaderboard, duration, emptyCopy, skeleton = false }) {
  const leaderboardRows = skeleton
    ? `
        <div class="ps-skeleton" data-ps="skeleton" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;flex-direction:column;gap:4px">
            <div style="height:11px;width:64px;border-radius:999px;background:var(--bg3)"></div>
            <div style="height:10px;width:96px;border-radius:999px;background:var(--bg3);opacity:.75"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <div style="height:38px;border-radius:12px;background:linear-gradient(90deg,var(--bg2),var(--bg3))"></div>
            <div style="height:38px;border-radius:12px;background:linear-gradient(90deg,var(--bg2),var(--bg3))"></div>
            <div style="height:38px;border-radius:12px;background:linear-gradient(90deg,var(--bg2),var(--bg3))"></div>
          </div>
        </div>
      `
    : `<div class="ps-rank-list" data-ps="rank-list">${renderLeaderboardRows(leaderboard.rows)}</div>`

  const durationBlock = skeleton
    ? `
        <div class="ps-duration" data-ps="duration" style="opacity:.7">
          <div class="ps-duration-bar">
            <div class="ps-duration-fill" data-ps="dur-fill" style="width:40%;opacity:.35"></div>
          </div>
          <div class="ps-duration-text" data-ps="dur-text">--</div>
        </div>
      `
    : `
        <div class="ps-duration" data-ps="duration">
          <div class="ps-duration-bar"><div class="ps-duration-fill" data-ps="dur-fill" style="width:${escapeHtml(duration.fill)}%"></div></div>
          <div class="ps-duration-text" data-ps="dur-text">${escapeHtml(duration.valueLabel)}</div>
        </div>
      `

  return `
    <div class="ps-panel">
      <div class="ps-section-title" style="padding:0 4px 2px">PLAYER STATS</div>
      <div class="ps-grid">
        ${cards.map((card, index) => `
          <div class="ps-card">
            <div class="ps-card-num" data-ps="card-${index}" style="color:${escapeHtml(card.color)}">${skeleton ? '--' : escapeHtml(card.value)}</div>
            <div class="ps-card-label">${escapeHtml(card.label)}</div>
          </div>
        `).join('')}
      </div>
      <div class="ps-section">
        <div class="ps-section-title">${escapeHtml(leaderboard.title)}</div>
        ${leaderboardRows}
      </div>
      <div class="ps-section">
        <div class="ps-section-title">${escapeHtml(duration.title)}</div>
        ${durationBlock}
      </div>
      ${skeleton ? `<div class="ps-empty">${emptyCopy}</div>` : ''}
    </div>
  `
}

function buildStatsDOM(root, model) {
  ensureCounters()
  root.innerHTML = renderStatsShell({
    cards: model.cards,
    leaderboard: model.leaderboards[0],
    duration: model.duration,
    emptyCopy: model.emptyState?.description || '开始协作后数据将自动更新',
    skeleton: false,
  })
  root._psBuilt = true
}

function buildSkeletonDOM(root, model) {
  root.innerHTML = renderStatsShell({
    cards: model.cards,
    leaderboard: model.leaderboards[0],
    duration: model.duration,
    emptyCopy: model.emptyState?.description || '开始协作后数据将自动更新',
    skeleton: true,
  })
  root._psBuilt = false
}

function isEmptyStatsModel(model) {
  const cardsEmpty = !model?.cards?.some((card) => Number(card?.value) > 0)
  const rowsEmpty = !model?.leaderboards?.some((section) => Array.isArray(section?.rows) && section.rows.length > 0)
  const durationEmpty = Number(model?.duration?.valueMs) <= 0
  return cardsEmpty && rowsEmpty && durationEmpty
}

function renderCardsInPlace(root, cards = []) {
  cards.forEach((card, index) => {
    const el = root.querySelector(`[data-ps="card-${index}"]`)
    if (el) {
      animateNumChange(el, String(card.value))
      el.style.color = card.color
    }
  })
}

function renderLeaderboardInPlace(root, leaderboard = { rows: [] }) {
  const rankList = root.querySelector('[data-ps="rank-list"]')
  if (!rankList) return
  rankList.innerHTML = renderLeaderboardRows(leaderboard.rows || [])
}

function renderDurationInPlace(root, duration = {}) {
  const durFill = root.querySelector('[data-ps="dur-fill"]')
  const durText = root.querySelector('[data-ps="dur-text"]')
  if (durFill) durFill.style.width = `${Math.max(0, Math.min(100, Number(duration.fill) || 0))}%`
  if (durText) durText.textContent = duration.valueLabel || '--'
}

export function updatePlayerStats(root, model) {
  if (!root || !root._psBuilt) return
  const safeModel = model && Array.isArray(model.cards) ? model : createFallbackModel()

  renderCardsInPlace(root, safeModel.cards || [])
  renderLeaderboardInPlace(root, safeModel.leaderboards?.[0] || { rows: safeModel.contribRows || [] })
  renderDurationInPlace(root, safeModel.duration || {
    fill: Math.min(100, Math.max(0, Math.round((safeModel.sessionDuration || 0) / (4 * 60 * 60 * 1000) * 100))),
    valueLabel: formatDurationHM(safeModel.sessionDuration || 0),
  })
}

export function renderPlayerStatsWindow(container, model = createFallbackModel()) {
  if (!container) return

  const safeModel = model && Array.isArray(model.cards) ? model : createFallbackModel()
  const isEmpty = isEmptyStatsModel(safeModel)

  if (isEmpty) {
    buildSkeletonDOM(container, safeModel)
    return
  }

  if (!container._psBuilt) {
    buildStatsDOM(container, safeModel)
    return
  }

  updatePlayerStats(container, safeModel)
}
