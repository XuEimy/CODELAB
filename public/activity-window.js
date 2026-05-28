const STATUS_META = {
  idle: { label: '待机中', tone: 'orange', detail: '胸口轻微呼吸，尾巴慢慢摆动。' },
  typing: { label: '打字中', tone: 'blue', detail: '前爪快速交替，小键盘轻轻上下弹。' },
  game: { label: '游戏中', tone: 'green', detail: '身体前倾，手柄左右轻晃，尾巴摆得更快。' },
  join: { label: '刚加入', tone: 'green', detail: '从卡片边缘滑入，停下后耳朵轻轻抖一下。' },
  leave: { label: '离开中', tone: 'pink', detail: '身体微微后撤，尾巴缩一下，再慢慢淡出。' },
  chat: { label: '发消息', tone: 'blue', detail: '抬头举出一张小信封，动作很短。' },
  apply: { label: '应用成功', tone: 'orange', detail: '小印章啪地落下，亮一下再恢复。' },
  design: { label: '设计中', tone: 'pink', detail: '小画板轻轻晃动，像在比对颜色。' },
  task: { label: '整理任务', tone: 'orange', detail: '低头翻一张小卡片，再把任务放好。' },
  ai: { label: 'AI 请求', tone: 'blue', detail: '小火花闪一下，像在请求新的灵感。' },
}

export const SYSTEM_EVENT_TAXONOMY = {
  'enter-workbench': { label: '进入工作台', icon: 'i-users', tone: 'green', statusKey: 'join' },
  'leave-workbench': { label: '离开工作台', icon: 'i-users', tone: 'orange', statusKey: 'leave' },
  'code-edit': { label: '编辑代码', icon: 'i-code', tone: 'blue', statusKey: 'typing' },
  'preview-run': { label: '运行预览', icon: 'i-gamepad', tone: 'green', statusKey: 'game' },
  'design-change': { label: '设计变更', icon: 'i-brush', tone: 'pink', statusKey: 'design' },
  'ai-request': { label: 'AI 请求', icon: 'i-sparkles', tone: 'blue', statusKey: 'ai' },
  'task-complete': { label: '任务状态', icon: 'i-clipboard', tone: 'orange', statusKey: 'task' },
}

export const ACTIVITY_MASCOTS = [
  {
    id: 'dog-golden',
    name: '参考柴犬',
    kind: 'dog',
    palette: {
      fur: '#f89e2b',
      furDark: '#d37012',
      cream: '#fff7eb',
      ink: '#151515',
      blush: '#ff8f95',
      ledge: '#1d1d1d',
      ledgeFill: '#fbfbfb',
      ledgeShadow: '#d4d4d4',
      glowA: '#c78f33',
      glowB: '#f2db9f',
      paw: '#ff7e8f',
    },
  },
]

function hashSeed(seed = '') {
  return Array.from(String(seed)).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0)
}

export function pickMascotVariant(seed) {
  return ACTIVITY_MASCOTS[hashSeed(seed) % ACTIVITY_MASCOTS.length].id
}

function getMascotById(id) {
  return ACTIVITY_MASCOTS.find((variant) => variant.id === id) || ACTIVITY_MASCOTS[0]
}

function getStatusMeta(statusKey) {
  return STATUS_META[statusKey] || STATUS_META.idle
}

function resolveModeStatus(mode = 'collab') {
  if (mode === 'design') return { statusKey: 'design', detail: '抱着小画板，正在整理界面细节。' }
  if (mode === 'game') return { statusKey: 'game', detail: '正在看游戏表现，身体会轻微前探。' }
  return { statusKey: 'idle', detail: STATUS_META.idle.detail }
}

function classifyKnownEvent(eventType, detail) {
  const taxonomy = SYSTEM_EVENT_TAXONOMY[eventType]
  const statusMeta = getStatusMeta(taxonomy?.statusKey)
  return {
    eventType,
    isSystemEvent: true,
    statusKey: taxonomy?.statusKey || 'idle',
    label: taxonomy?.label || statusMeta.label,
    tone: taxonomy?.tone || statusMeta.tone,
    icon: taxonomy?.icon || 'i-zap',
    detail: detail || statusMeta.detail,
  }
}

export function classifyActivityText(text = '') {
  const sourceText = String(text).trim()

  if (/进入了工作台|加入了房间/u.test(sourceText)) {
    return classifyKnownEvent('enter-workbench', '进入了工作台')
  }
  if (/离开了工作台|离开了房间|离开$/u.test(sourceText)) {
    return classifyKnownEvent('leave-workbench', '离开了工作台')
  }

  const codeMatch = sourceText.match(/编辑了\s+(.+)/u)
  if (codeMatch) {
    return classifyKnownEvent('code-edit', `编辑了 ${codeMatch[1].trim()}`)
  }
  if (/运行了游戏预览|运行了游戏/u.test(sourceText)) {
    return classifyKnownEvent('preview-run', '运行了游戏预览')
  }
  if (/应用了设计变更|应用了设计/u.test(sourceText)) {
    return classifyKnownEvent('design-change', '应用了设计变更')
  }
  if (/向 AI 提问|向AI提问|应用了 AI 代码/u.test(sourceText)) {
    return classifyKnownEvent('ai-request', '向 AI 提问')
  }

  const taskDoneMatch = sourceText.match(/将\s+(.+?)\s+标记为已完成/u)
  if (taskDoneMatch) {
    return classifyKnownEvent('task-complete', `将 ${taskDoneMatch[1].trim()} 标记为已完成`)
  }

  if (sourceText.includes(':')) {
    return {
      eventType: 'human-message',
      isSystemEvent: false,
      statusKey: 'idle',
      label: STATUS_META.idle.label,
      tone: STATUS_META.idle.tone,
      icon: '',
      detail: sourceText,
    }
  }

  return {
    eventType: 'unknown',
    isSystemEvent: false,
    statusKey: 'idle',
    label: STATUS_META.idle.label,
    tone: STATUS_META.idle.tone,
    icon: '',
    detail: STATUS_META.idle.detail,
  }
}

export function buildPresenceActivityItems(users = []) {
  return users.map((user, index) => {
    let statusKey = 'idle'
    let detail = STATUS_META.idle.detail
    if (user.typing) {
      statusKey = 'typing'
      detail = STATUS_META.typing.detail
    } else if (user.viewing) {
      statusKey = 'game'
      detail = '身体前倾，像在认真盯着正在运行的画面。'
    } else {
      const modeStatus = resolveModeStatus(user.mode)
      statusKey = modeStatus.statusKey
      detail = modeStatus.detail
    }
    const meta = getStatusMeta(statusKey)
    return {
      id: `presence-${user.id || user.name || index}`,
      userId: user.id || user.name || `presence-${index}`,
      name: user.name || `玩家${index + 1}`,
      statusKey,
      statusLabel: meta.label,
      detail,
      colorIdx: user.color || 0,
      timestamp: '',
      mascotId: pickMascotVariant(user.id || user.name || index),
      source: 'presence',
    }
  })
}

export function buildEventActivityItem({ id, userId, name, text, colorIdx = 0, timestamp = '', mascotId } = {}) {
  const sourceText = String(text || '').trim()
  const meta = classifyActivityText(sourceText)
  return {
    id: id || `event-${userId || name || 'user'}-${timestamp || Date.now()}`,
    userId: userId || name || 'user',
    name: name || extractActivityName(sourceText) || '协作者',
    statusKey: meta.statusKey,
    statusLabel: meta.label,
    detail: meta.detail,
    colorIdx,
    timestamp,
    mascotId: mascotId || pickMascotVariant(userId || name || text || 'user'),
    source: 'event',
    eventType: meta.eventType,
    isSystemEvent: meta.isSystemEvent,
    icon: meta.icon,
    tone: meta.tone,
  }
}

function toneClass(statusKey) {
  return getStatusMeta(statusKey).tone
}

function rect(x, y, width, height, fill, pixel) {
  return `<rect x="${x * pixel}" y="${y * pixel}" width="${width * pixel}" height="${height * pixel}" fill="${fill}"/>`
}

function pixelCircles(cx, cy, coords, fill, pixel) {
  return coords.map(([dx, dy]) => rect(cx + dx, cy + dy, 1, 1, fill, pixel)).join('')
}

function buildReferenceShiba(mascot, pixel) {
  const { fur, furDark, cream, ink, blush, ledge, ledgeFill, ledgeShadow, glowA, glowB, paw } = mascot.palette
  return [
    `<defs>
      <linearGradient id="shibaBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${glowA}"/>
        <stop offset="100%" stop-color="${glowB}"/>
      </linearGradient>
    </defs>`,
    `<rect x="0" y="0" width="96" height="96" rx="18" fill="url(#shibaBg)"/>`,
    rect(-2, 26, 40, 2, ledge, pixel),
    rect(0, 28, 38, 14, ledgeFill, pixel),
    rect(0, 40, 38, 2, ledgeShadow, pixel),
    rect(3, 33, 4, 3, '#f3f3f3', pixel),
    rect(9, 29, 4, 3, '#f3f3f3', pixel),
    rect(15, 34, 4, 3, '#f3f3f3', pixel),
    rect(27, 31, 5, 3, '#fff0ad', pixel),
    rect(13, 10, 2, 6, ink, pixel),
    rect(23, 10, 2, 6, ink, pixel),
    rect(14, 11, 4, 5, fur, pixel),
    rect(20, 11, 4, 5, fur, pixel),
    rect(15, 8, 8, 2, ink, pixel),
    rect(14, 10, 10, 9, fur, pixel),
    rect(12, 12, 14, 8, fur, pixel),
    rect(10, 15, 18, 7, fur, pixel),
    rect(12, 20, 14, 4, furDark, pixel),
    rect(13, 16, 12, 6, cream, pixel),
    rect(8, 19, 4, 4, cream, pixel),
    rect(26, 19, 4, 4, cream, pixel),
    rect(9, 17, 3, 3, furDark, pixel),
    rect(27, 17, 3, 3, furDark, pixel),
    rect(8, 21, 5, 4, cream, pixel),
    rect(25, 21, 5, 4, cream, pixel),
    rect(15, 18, 2, 4, ink, pixel),
    rect(21, 18, 2, 4, ink, pixel),
    rect(16, 19, 1, 1, '#ffffff', pixel),
    rect(22, 19, 1, 1, '#ffffff', pixel),
    rect(18, 20, 2, 2, ink, pixel),
    rect(17, 22, 4, 1, ink, pixel),
    rect(18, 23, 2, 2, '#ff6c74', pixel),
    rect(12, 21, 2, 2, blush, pixel),
    rect(24, 21, 2, 2, blush, pixel),
    rect(11, 26, 5, 5, cream, pixel),
    rect(22, 26, 5, 5, cream, pixel),
    rect(11, 26, 5, 1, ink, pixel),
    rect(22, 26, 5, 1, ink, pixel),
    pixelCircles(12, 28, [[0, 0], [2, 0], [1, 1]], paw, pixel),
    pixelCircles(23, 28, [[0, 0], [2, 0], [1, 1]], paw, pixel),
    rect(28, 18, 4, 8, fur, pixel),
    rect(29, 19, 4, 6, furDark, pixel),
    rect(30, 19, 3, 4, cream, pixel),
  ].join('')
}

function renderMascotSvg(mascotId) {
  const mascot = getMascotById(mascotId)
  const pixel = 3
  const content = buildReferenceShiba(mascot, pixel)
  return `
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      ${content}
    </svg>
  `
}

function cardTimestamp(item) {
  return item.timestamp || ''
}

function cardTypeLabel(item) {
  if (item.source === 'event') return '系统事件'
  return '在线中'
}

function extractActivityName(text = '') {
  const sourceText = String(text).trim()
  const match = sourceText.match(/^(.+?)(?:\s+(?:进入了工作台|加入了房间|离开了工作台|离开了房间|编辑了|运行了游戏预览|运行了游戏|应用了设计变更|应用了设计|向 AI 提问|向AI提问|应用了 AI 代码|将)|:)/u)
  return match?.[1]?.trim() || ''
}

function renderPresenceRow(item, meta) {
  return `
    <article class="activity-row activity-row--${item.statusKey}">
      <div class="activity-row__dot activity-row__dot--${toneClass(item.statusKey)}"></div>
      <div class="activity-row__main">
        <div class="activity-row__meta">
          <div class="activity-row__name">${escapeHtml(item.name)}</div>
          <span class="activity-pill activity-pill--${toneClass(item.statusKey)}">${escapeHtml(item.statusLabel || meta.label)}</span>
        </div>
        <div class="activity-row__detail">${escapeHtml(item.detail || meta.detail)}</div>
      </div>
      <div class="activity-row__time">${cardTimestamp(item)}</div>
    </article>
  `
}

function renderSystemEventRow(item, meta) {
  const eventMeta = SYSTEM_EVENT_TAXONOMY[item.eventType] || SYSTEM_EVENT_TAXONOMY['enter-workbench']
  return `
    <article class="activity-row activity-row--system activity-row--${item.statusKey}" data-event-type="${escapeHtml(item.eventType || 'system')}">
      <div class="activity-row__dot activity-row__dot--${escapeHtml(item.tone || eventMeta.tone)}"></div>
      <div class="activity-row__main">
        <div class="activity-row__meta">
          <div class="activity-row__name">${escapeHtml(item.name)}</div>
          <span class="activity-pill activity-pill--${escapeHtml(item.tone || eventMeta.tone)}">${escapeHtml(item.statusLabel || eventMeta.label)}</span>
        </div>
        <div class="activity-row__detail">${escapeHtml(item.detail || meta.detail)}</div>
      </div>
      <div class="activity-row__time">${cardTimestamp(item)}</div>
    </article>
  `
}

export function renderActivityFeed(container, items = []) {
  if (!container) return

  const visibleItems = items.filter((item) => item?.source !== 'event' || item.isSystemEvent !== false)

  const totalCount = visibleItems.length
  const typeCountMap = {}
  visibleItems.forEach((item) => {
    const key = item.statusLabel || item.statusKey || 'other'
    typeCountMap[key] = (typeCountMap[key] || 0) + 1
  })
  const typeSummary = Object.entries(typeCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => `<span>${escapeHtml(label)} ${count}</span>`)
    .join('')

  if (!visibleItems.length) {
    container.innerHTML = `
      <div class="activity-log">
        <div class="activity-log__head">
          <div class="studio-window__mini-head"><strong>修改日志</strong><span>0 条记录</span></div>
        </div>
        <div class="activity-log__body">
          <div class="activity-empty">
            <div class="activity-empty__title">暂无修改记录</div>
            <div class="activity-empty__copy">编辑代码、运行预览、应用设计等操作会自动记录在这里。</div>
          </div>
        </div>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="activity-log">
      <div class="activity-log__head">
        <div class="studio-window__mini-head"><strong>修改日志</strong><span>${totalCount} 条记录</span></div>
        <div class="activity-log__summary">${typeSummary}</div>
      </div>
      <div class="activity-log__body">
        ${visibleItems
          .map((item) => {
            const meta = getStatusMeta(item.statusKey)
            if (item.source === 'event') return renderSystemEventRow(item, meta)
            return renderPresenceRow(item, meta)
          })
          .join('')}
      </div>
    </div>
  `
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
