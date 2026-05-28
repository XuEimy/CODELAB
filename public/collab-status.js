function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeJoinTimes(joinTimes) {
  if (joinTimes instanceof Map) return joinTimes
  return new Map(Object.entries(joinTimes || {}))
}

function formatDurationShort(ms) {
  const totalMinutes = Math.max(1, Math.round((Number(ms) || 0) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getModeLabel(mode = '') {
  if (!mode) return '协作'
  if (String(mode).startsWith('pw-')) return '工作台'
  const labels = {
    chat: '讨论',
    design: '设计',
    dev: '开发',
    task: '任务',
    game: '预览',
  }
  return labels[mode] || '协作'
}

function getModeTone(mode = '') {
  if (String(mode).startsWith('pw-')) return 'var(--accent2)'
  const tones = {
    chat: 'var(--green)',
    design: 'var(--pink)',
    dev: 'var(--purple)',
    task: 'var(--gold)',
    game: 'var(--orange)',
  }
  return tones[mode] || 'var(--accent)'
}

function getAvatarPalette(color = 0) {
  const palettes = [
    { fg: 'var(--accent)', bg: 'var(--accent-bg)' },
    { fg: 'var(--green)', bg: 'var(--green-bg)' },
    { fg: 'var(--pink)', bg: 'var(--pink-bg)' },
    { fg: 'var(--gold)', bg: 'var(--gold-bg)' },
    { fg: 'var(--purple)', bg: 'var(--purple-bg)' },
    { fg: 'var(--orange)', bg: 'rgba(251,146,60,.08)' },
  ]
  const index = Math.abs(Number(color) || 0) % palettes.length
  return palettes[index]
}

function buildStatusMeta(user = {}) {
  if (user.typing) {
    return { label: '正在输入', typing: true }
  }
  if (user.viewing) {
    return { label: '正在预览', typing: false }
  }
  return { label: '在线协作', typing: false }
}

function buildItem(user = {}, { now, joinTimes, localUserId, currentMode }) {
  const palette = getAvatarPalette(user.color)
  const modeLabel = getModeLabel(user.mode)
  const statusMeta = buildStatusMeta(user)
  const joinedAt = joinTimes.get(user.id) || now

  return {
    id: user.id || '',
    name: user.name || '协作者',
    avatarLabel: String(user.name || '协').trim().slice(0, 1).toUpperCase() || '协',
    avatarFg: palette.fg,
    avatarBg: palette.bg,
    modeLabel,
    modeTone: getModeTone(user.mode),
    statusLabel: statusMeta.label,
    showTypingDots: statusMeta.typing,
    isMe: user.id === localUserId,
    isActive: Boolean(currentMode && user.mode && currentMode === user.mode),
    timeLabel: formatDurationShort(Math.max(0, now - joinedAt)),
  }
}

function sortItems(items = []) {
  return [...items].sort((left, right) => {
    if (left.isMe !== right.isMe) return left.isMe ? -1 : 1
    if (left.showTypingDots !== right.showTypingDots) return left.showTypingDots ? -1 : 1
    if (left.statusLabel !== right.statusLabel) {
      if (left.statusLabel === '正在预览') return -1
      if (right.statusLabel === '正在预览') return 1
    }
    return String(left.name).localeCompare(String(right.name), 'zh-Hans-CN')
  })
}

export function buildCollabStatusModel({
  now = Date.now(),
  users = [],
  joinTimes = new Map(),
  localUserId = '',
  currentMode = '',
} = {}) {
  const joinMap = normalizeJoinTimes(joinTimes)
  const normalizedUsers = Array.isArray(users) ? users.filter((user) => user?.id) : []
  const items = sortItems(
    normalizedUsers.map((user) =>
      buildItem(user, {
        now,
        joinTimes: joinMap,
        localUserId,
        currentMode,
      }),
    ),
  )

  return {
    title: '协作状况',
    emptyCopy: '开始协作后这里会显示在线协作者',
    items,
  }
}

function renderTypingDots() {
  return '<span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>'
}

function renderItem(item) {
  return `
    <div class="collab-user${item.isActive ? ' is-active' : ''}" data-collab-user="${escapeHtml(item.id)}">
      <div class="collab-avatar" style="background:${escapeHtml(item.avatarBg)};color:${escapeHtml(item.avatarFg)};border-color:${escapeHtml(item.avatarFg)}">
        ${escapeHtml(item.avatarLabel)}
        <span class="mode-dot" style="background:${escapeHtml(item.modeTone)}"></span>
      </div>
      <div class="collab-info">
        <div class="collab-name">
          <span>${escapeHtml(item.name)}${item.isMe ? '（我）' : ''}</span>
          <span style="font-size:9px;color:var(--textd);font-weight:500">${escapeHtml(item.modeLabel)}</span>
        </div>
        <div class="collab-status">
          <span>${escapeHtml(item.statusLabel)}</span>
          ${item.showTypingDots ? renderTypingDots() : ''}
        </div>
      </div>
      <div class="collab-time">${escapeHtml(item.timeLabel)}</div>
    </div>
  `
}

export function renderCollabStatusWindow(container, model = buildCollabStatusModel()) {
  if (!container) return

  const safeModel = model && Array.isArray(model.items) ? model : buildCollabStatusModel()
  if (!safeModel.items.length) {
    container.innerHTML = `<div class="collab-list"><div class="ps-empty">${escapeHtml(safeModel.emptyCopy || '开始协作后这里会显示在线协作者')}</div></div>`
    return
  }

  container.innerHTML = `<div class="collab-list">${safeModel.items.map(renderItem).join('')}</div>`
}
