export const CHAT_EMOJIS = [
  { id: 'thumbs_up', label: '收到', char: '👍', src: '/vendor/fluent-emoji/thumbs-up.svg' },
  { id: 'sparkles', label: '灵感', char: '✨', src: '/vendor/fluent-emoji/sparkles.svg' },
  { id: 'fire', label: '冲', char: '🔥', src: '/vendor/fluent-emoji/fire.svg' },
  { id: 'eyes', label: '在看', char: '👀', src: '/vendor/fluent-emoji/eyes.svg' },
  { id: 'brain', label: '思考中', char: '🧠', src: '/vendor/fluent-emoji/brain.svg' },
  { id: 'robot', label: 'AI', char: '🤖', src: '/vendor/fluent-emoji/robot.svg' },
  { id: 'party_popper', label: '过了', char: '🎉', src: '/vendor/fluent-emoji/party-popper.svg' },
  { id: 'pushpin', label: '重点', char: '📌', src: '/vendor/fluent-emoji/pushpin.svg' },
  { id: 'heart', label: '喜欢', char: '❤️', src: '/vendor/fluent-emoji/red-heart.svg' },
  { id: 'clap', label: '鼓掌', char: '👏', src: '/vendor/fluent-emoji/clapping-hands.svg' },
  { id: 'rocket', label: '开冲', char: '🚀', src: '/vendor/fluent-emoji/rocket.svg' },
  { id: 'ok_hand', label: 'OK', char: '👌', src: '/vendor/fluent-emoji/ok-hand.svg' },
  { id: 'laugh', label: '笑', char: '😂', src: '/vendor/fluent-emoji/face-with-tears-of-joy.svg' },
  { id: 'cry', label: '哭了', char: '😭', src: '/vendor/fluent-emoji/loudly-crying-face.svg' },
  { id: 'mind_blown', label: '炸了', char: '🤯', src: '/vendor/fluent-emoji/exploding-head.svg' },
  { id: 'thinking', label: '想想', char: '🤔', src: '/vendor/fluent-emoji/thinking-face.svg' },
  { id: 'salute', label: '收到', char: '🫡', src: '/vendor/fluent-emoji/saluting-face.svg' },
  { id: 'coffee', label: '咖啡', char: '☕', src: '/vendor/fluent-emoji/hot-beverage.svg' },
  { id: 'bug', label: 'Bug', char: '🐛', src: '/vendor/fluent-emoji/bug.svg' },
  { id: 'light_bulb', label: '点子', char: '💡', src: '/vendor/fluent-emoji/light-bulb.svg' },
]

export const CHAT_STICKERS = CHAT_EMOJIS

export const CHAT_AVATAR_COLORS = ['#2563eb', '#16a34a', '#e11d48', '#d97706', '#7c3aed', '#ea580c']

const CHAT_AI_NAME_HINTS = new Set(['ai', '主持ai', '主持 ai', '主持-ai', '系统ai', '系统 ai', 'host ai', 'assistant'])

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function uid(prefix = 'msg') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function formatTime(createdAt) {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function getEmoji(emojiId) {
  return CHAT_EMOJIS.find((item) => item.id === emojiId) || null
}

function normalizeName(name = '') {
  return String(name || '').trim().replace(/\s+/g, ' ')
}

function isAiName(name = '') {
  const normalized = normalizeName(name).toLowerCase()
  return CHAT_AI_NAME_HINTS.has(normalized)
}

function isEmojiOnly(text = '') {
  const stripped = String(text || '').replace(/\s+/g, '')
  if (!stripped) return false
  return /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F]+$/u.test(stripped)
}

function getPaletteColor(color = 0) {
  const index = Math.abs(Number(color) || 0) % CHAT_AVATAR_COLORS.length
  const hex = CHAT_AVATAR_COLORS[index]
  return {
    bg: `${hex}22`,
    border: `${hex}66`,
    fg: hex,
  }
}

function renderAvatarInitial(name = '') {
  const initial = normalizeName(name).slice(0, 1) || '协'
  return escapeHtml(initial.toUpperCase())
}

function renderEmojiThumb(emoji, size = 22) {
  if (emoji?.src) {
    return `<img class="team-chat__emoji-icon emoji-popup-char" src="${escapeHtml(emoji.src)}" alt="${escapeHtml(emoji.label || '')}" width="${size}" height="${size}">`
  }

  return `<span class="team-chat__emoji-char emoji-popup-char" style="font-size:${Math.max(size - 2, 18)}px">${escapeHtml(emoji?.char || '🙂')}</span>`
}

function renderAvatar({
  name = '',
  color = 0,
  avatarUrl = '',
  emoji = '',
  isAI = false,
  label = '',
} = {}) {
  if (avatarUrl) {
    return `
      <span class="msg-av${isAI ? ' msg-av-ai' : ''}" data-role="message-avatar" aria-hidden="true">
        <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name || label || 'avatar')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
      </span>
    `
  }

  if (emoji) {
    const emojiMeta = getEmoji(emoji)
    return `
      <span class="msg-av${isAI ? ' msg-av-ai' : ''}" data-role="message-avatar" aria-hidden="true">
        ${renderEmojiThumb(emojiMeta || { char: emoji, label: label || emoji }, isAI ? 18 : 16)}
      </span>
    `
  }

  if (isAI) {
    return `<span class="msg-av msg-av-ai" data-role="message-avatar" aria-hidden="true">✦</span>`
  }

  const palette = getPaletteColor(color)
  return `
    <span
      class="msg-av"
      data-role="message-avatar"
      data-color="${escapeHtml(color)}"
      style="background:${palette.bg};border-color:${palette.border};color:${palette.fg}"
      aria-hidden="true"
    >
      ${renderAvatarInitial(name || label)}
    </span>
  `
}

function renderTextBlock(text = '') {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

function renderLegacyEmojiContent(message) {
  const emoji = getEmoji(message.stickerId)
  return `
    <div class="team-chat__emoji-bubble is-legacy" data-role="emoji-message">
      ${renderEmojiThumb(emoji, 26)}
      <span>${escapeHtml(emoji?.label || message.text)}</span>
    </div>
  `
}

function renderMessageActions(message) {
  return `
    <div class="team-chat__msg-actions msg-actions" data-role="message-actions">
      <button class="team-chat__msg-btn msg-action-btn" type="button" data-action="pin" data-message-id="${escapeHtml(message.id)}">置顶</button>
      <button class="team-chat__msg-btn msg-action-btn" type="button" data-action="ai" data-message-id="${escapeHtml(message.id)}">发给 AI</button>
      <button class="team-chat__msg-btn msg-action-btn" type="button" data-action="task" data-message-id="${escapeHtml(message.id)}">转任务</button>
      <button class="team-chat__msg-btn msg-action-btn danger" type="button" data-action="delete" data-message-id="${escapeHtml(message.id)}">删除</button>
    </div>
  `
}

function renderMessageBubble(message, { isAI = false, emojiOnly = false } = {}) {
  if (message.kind === 'emoji') {
    return renderLegacyEmojiContent(message)
  }

  const bubbleClass = isAI ? 'msg-bub msg-bub-ai' : 'msg-bub msg-bub-player'
  return `<div class="${bubbleClass}${emojiOnly ? ' is-emoji-only' : ''}" data-role="message-bubble">${renderTextBlock(message.text)}</div>`
}

function isAiMessage(message) {
  return message.role === 'ai' || message.kind === 'ai' || isAiName(message.name)
}

function renderMessage(message, { pinnedMessageId = '', meName = '', showActions = true } = {}) {
  const normalized = normalizeChatMessage(message)
  const isAI = isAiMessage(normalized)
  const mine = !isAI && normalizeName(normalized.name) === normalizeName(meName)
  const emojiOnly = normalized.kind === 'text' && isEmojiOnly(normalized.text)
  const rowClass = isAI ? 'ai' : 'me'
  const nameClass = isAI ? 'msg-name msg-name-ai' : 'msg-name'
  const avatar = renderAvatar({
    name: normalized.name,
    color: normalized.color,
    avatarUrl: normalized.avatarUrl,
    emoji: normalized.avatarEmoji,
    isAI,
    label: normalized.name,
  })

  return `
    <article
      class="team-chat__msg msg ${rowClass}${mine ? ' is-self' : ''}${normalized.id === pinnedMessageId ? ' is-pinned' : ''}"
      data-message-id="${escapeHtml(normalized.id)}"
      data-role="chat-message"
      data-message-kind="${escapeHtml(isAI ? 'ai' : normalized.kind)}"
      data-author-role="${escapeHtml(normalized.role)}"
      data-self="${mine ? 'true' : 'false'}"
    >
      ${avatar}
      <div class="team-chat__msg-body msg-body">
        <div class="${nameClass}" data-role="message-meta">
          <span class="team-chat__msg-name-text">${escapeHtml(normalized.name)}</span>
          <span class="msg-time">${escapeHtml(formatTime(normalized.createdAt))}</span>
        </div>
        ${renderMessageBubble(normalized, { isAI, emojiOnly })}
        ${showActions ? renderMessageActions(normalized) : ''}
      </div>
    </article>
  `
}

function renderEmojiButton(emoji) {
  return `
    <button class="team-chat__emoji-btn emoji-popup-btn" type="button" data-action="insert-emoji" data-emoji-id="${escapeHtml(emoji.id)}" title="${escapeHtml(emoji.label)}">
      ${renderEmojiThumb(emoji, 28)}
    </button>
  `
}

function normalizeParticipant(user = {}, index = 0) {
  const name = normalizeName(user.name || user.label || '协作者')
  const isAI = user.role === 'ai' || user.isAI === true || isAiName(name)

  return {
    id: user.id || name || `user-${index}`,
    name: name || '协作者',
    avatarUrl: user.avatarUrl || '',
    emoji: user.emoji || '',
    color: Number.isFinite(Number(user.color)) ? Number(user.color) : index,
    isMe: Boolean(user.isMe),
    isAI,
    role: isAI ? 'ai' : 'human',
    status: user.status || '',
  }
}

function renderParticipantAvatar(user) {
  const normalized = normalizeParticipant(user)

  if (normalized.isAI) {
    return `<span class="mention-popup-dot mention-popup-item-ai" aria-hidden="true">✦</span>`
  }

  if (normalized.avatarUrl) {
    return `
      <span class="mention-popup-dot" aria-hidden="true" style="width:20px;height:20px;border-radius:50%;overflow:hidden;flex-shrink:0">
        <img src="${escapeHtml(normalized.avatarUrl)}" alt="${escapeHtml(normalized.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
      </span>
    `
  }

  const palette = getPaletteColor(normalized.color)
  return `<span class="mention-popup-dot" aria-hidden="true" style="background:${palette.fg}"></span>`
}

function renderMentionItem(user, index = 0) {
  const normalized = normalizeParticipant(user, index)
  return `
    <button
      class="team-chat__mention-item mention-popup-item${normalized.isAI ? ' mention-popup-item-ai' : ''}"
      type="button"
      data-action="insert-mention"
      data-mention-id="${escapeHtml(normalized.id)}"
      data-mention-name="${escapeHtml(normalized.name)}"
      data-mention-role="${escapeHtml(normalized.role)}"
      data-mention-ai="${normalized.isAI ? 'true' : 'false'}"
      title="${escapeHtml(normalized.name)}"
    >
      ${renderParticipantAvatar(normalized)}
      <span class="team-chat__mention-name mention-popup-name">${escapeHtml(normalized.name)}</span>
      ${normalized.isMe ? '<span class="mention-popup-me">(我)</span>' : ''}
    </button>
  `
}

function renderAiMentionItem() {
  return `
    <button
      class="team-chat__mention-item mention-popup-item mention-popup-item-ai"
      type="button"
      data-action="insert-mention"
      data-mention-id="ai"
      data-mention-name="AI"
      data-mention-role="ai"
      data-mention-ai="true"
      title="AI 主持人"
    >
      <span class="mention-popup-dot mention-popup-item-ai" aria-hidden="true">✦</span>
      <span class="team-chat__mention-name mention-popup-name">AI 主持人</span>
    </button>
  `
}

function renderChatHeader({
  messageCount = 0,
  connected = true,
  syncLabel = '',
  syncState = '',
} = {}) {
  const resolvedState = syncState || (connected ? 'syncing' : 'offline')
  const resolvedLabel = syncLabel || (resolvedState === 'offline' ? '离线' : '同步中')
  const syncIcon = resolvedState === 'offline' ? '○' : '↻'

  return `
    <div class="team-chat__header chat-header" data-role="chat-header" data-sync-state="${escapeHtml(resolvedState)}">
      <div class="chat-header-dot" aria-hidden="true"></div>
      <span class="chat-header-count" data-role="message-count">${escapeHtml(messageCount)} 条消息</span>
      <span class="chat-header-sync" data-role="sync-badge">
        <span aria-hidden="true">${syncIcon}</span>
        ${escapeHtml(resolvedLabel)}
      </span>
    </div>
  `
}

function renderTypingIndicator({
  name = '主持 AI',
  statusText = '正在思考...',
} = {}) {
  return `
    <div class="typing-indicator team-chat__typing" data-role="typing-indicator">
      <div class="msg-av msg-av-ai" aria-hidden="true">✦</div>
      <div class="msg-body">
        <div class="msg-name msg-name-ai">
          ${escapeHtml(name)}
          <span class="msg-time">${escapeHtml(statusText)}</span>
        </div>
        <div class="typing-dots" aria-hidden="true">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `
}

function renderStreamingMessage({
  name = '主持 AI',
  statusText = '回复中...',
  text = '',
} = {}) {
  return `
    <div class="msg ai team-chat__streaming" data-role="streaming-message">
      <div class="msg-av msg-av-ai" aria-hidden="true">✦</div>
      <div class="msg-body">
        <div class="msg-name msg-name-ai">
          ${escapeHtml(name)}
          <span class="msg-time">${escapeHtml(statusText)}</span>
        </div>
        <div class="msg-bub msg-bub-ai" data-role="streaming-text">${renderTextBlock(text)}</div>
      </div>
    </div>
  `
}

function renderEmptyState(message = '还没有消息，先发一句试试看。') {
  return `
    <div class="team-chat__empty" data-role="chat-empty">
      ${escapeHtml(message)}
    </div>
  `
}

function renderEmojiPanel({
  emojiPanelOpen = false,
} = {}) {
  return `
    <div
      class="team-chat__panel team-chat__emoji-panel emoji-popup${emojiPanelOpen ? ' is-open' : ''}"
      id="chat-emoji-panel"
      data-role="emoji-panel"
      aria-hidden="${emojiPanelOpen ? 'false' : 'true'}"
      ${emojiPanelOpen ? '' : 'hidden'}
    >
      <div class="team-chat__panel-head">表情</div>
      <div class="team-chat__emoji-grid emoji-popup-grid">
        ${CHAT_EMOJIS.map(renderEmojiButton).join('')}
      </div>
    </div>
  `
}

function renderMentionPanel({
  mentionPanelOpen = false,
  participants = [],
} = {}) {
  const normalizedParticipants = participants.map(normalizeParticipant)

  return `
    <div
      class="team-chat__panel team-chat__mention-panel mention-popup${mentionPanelOpen ? ' is-open' : ''}"
      id="chat-mention-panel"
      data-role="mention-panel"
      aria-hidden="${mentionPanelOpen ? 'false' : 'true'}"
      ${mentionPanelOpen ? '' : 'hidden'}
    >
      <div class="team-chat__panel-head mention-popup-title">@ 成员</div>
      <div class="team-chat__mention-list" data-role="mention-list">
        ${renderAiMentionItem()}
        ${
          normalizedParticipants.length
            ? normalizedParticipants.map((participant, index) => renderMentionItem(participant, index)).join('')
            : '<div class="team-chat__empty team-chat__empty--panel" data-role="mention-empty">当前没有其他在线成员</div>'
        }
      </div>
    </div>
  `
}

function renderChatComposer({
  draft = '',
  emojiPanelOpen = false,
  mentionPanelOpen = false,
  participants = [],
  placeholder = '发消息，Shift + Enter 换行',
  showAiOrganize = true,
  showQuickAiMention = true,
} = {}) {
  return `
    <div class="team-chat__composer team-chat__dock chat-input-area" data-role="chat-composer">
      <div class="team-chat__composer-main chat-input-row">
        <textarea
          class="team-chat__textarea chat-input"
          id="chat-inp"
          data-role="chat-input"
          data-autosize="true"
          rows="1"
          placeholder="${escapeHtml(placeholder)}"
        >${escapeHtml(draft)}</textarea>
        <button class="team-chat__send chat-send" type="button" data-action="send">发送</button>
      </div>
      <div class="team-chat__toolbar chat-toolbar" id="chat-toolbar" data-role="chat-toolbar">
        ${renderEmojiPanel({ emojiPanelOpen })}
        ${renderMentionPanel({ mentionPanelOpen, participants })}
        <button class="team-chat__tool chat-tool${emojiPanelOpen ? ' active' : ''}" type="button" data-action="toggle-emojis" aria-expanded="${emojiPanelOpen ? 'true' : 'false'}">表情</button>
        <button class="team-chat__tool chat-tool${mentionPanelOpen ? ' active' : ''}" type="button" data-action="toggle-mentions" aria-expanded="${mentionPanelOpen ? 'true' : 'false'}">@ 成员</button>
        ${showQuickAiMention ? '<button class="team-chat__tool chat-tool" type="button" data-action="insert-ai-mention">@AI</button>' : ''}
        ${showAiOrganize ? '<button class="team-chat__tool chat-tool chat-tool-primary" type="button" data-action="ai-organize">AI 整理</button>' : ''}
      </div>
    </div>
  `
}

export function createChatMessage({
  id,
  name,
  text,
  color = 0,
  kind = 'text',
  stickerId = '',
  createdAt = Date.now(),
  role = 'human',
  avatarUrl = '',
  avatarEmoji = '',
  status = '',
} = {}) {
  const resolvedRole = role === 'ai' || kind === 'ai' || isAiName(name) ? 'ai' : 'human'

  return {
    id: id || uid('chat'),
    name: resolvedRole === 'ai' ? name || '主持 AI' : name || '协作者',
    text: text || '',
    color,
    kind,
    stickerId,
    createdAt,
    role: resolvedRole,
    avatarUrl,
    avatarEmoji,
    status,
  }
}

export function normalizeChatMessage(raw = {}) {
  const kind = raw.kind === 'sticker' ? 'emoji' : raw.kind || 'text'
  const role = raw.role || raw.authorRole || (kind === 'ai' || isAiName(raw.name) ? 'ai' : 'human')

  return createChatMessage({
    id: raw.id,
    name: raw.name,
    text: raw.text,
    color: raw.color,
    kind,
    stickerId: raw.stickerId || '',
    createdAt: raw.createdAt || Date.now(),
    role,
    avatarUrl: raw.avatarUrl || '',
    avatarEmoji: raw.avatarEmoji || raw.emoji || '',
    status: raw.status || '',
  })
}

export function buildAiPromptFromMessage(message) {
  const normalized = normalizeChatMessage(message)
  return `请基于这条团队聊天消息继续处理：\n\n团队聊天消息：${normalized.name}: ${normalized.text}\n\n请判断这更像是代码需求、设计需求、玩法需求还是任务拆解，并给出下一步建议。`
}

export function buildAiSummaryPromptFromMessages(messages = [], { roomName = '团队聊天' } = {}) {
  const normalizedMessages = messages.map(normalizeChatMessage)
  const content = normalizedMessages
    .map((message) => `${message.name}: ${message.text}`)
    .join('\n')

  return [
    `你正在整理 ${roomName} 的讨论记录。`,
    '请提炼出 3-5 条结论、待办和风险，并保持简洁。',
    '如果消息里包含明确决策，请优先归纳成待执行项。',
    '',
    content || '（当前没有消息）',
  ].join('\n')
}

export function autoSizeChatTextarea(textarea, { minHeight = 40, maxHeight = 100 } = {}) {
  if (!textarea) return 0

  const boundedMax = Math.max(minHeight, maxHeight)
  textarea.style.height = 'auto'
  const nextHeight = Math.min(Math.max(textarea.scrollHeight || minHeight, minHeight), boundedMax)
  textarea.style.height = `${nextHeight}px`
  textarea.style.overflowY = textarea.scrollHeight > boundedMax ? 'auto' : 'hidden'
  return nextHeight
}

export function renderChatHeaderContent(options = {}) {
  return renderChatHeader(options)
}

export function renderChatMessageContent(message, options = {}) {
  return renderMessage(message, options)
}

export function renderTypingIndicatorContent(options = {}) {
  return renderTypingIndicator(options)
}

export function renderChatComposerContent(options = {}) {
  return renderChatComposer(options)
}

export function renderStreamingMessageContent(options = {}) {
  return renderStreamingMessage(options)
}

export function renderChatToolbarContent(options = {}) {
  return renderChatComposer(options)
}

export function renderTeamChatWindow(
  container,
  {
    messages = [],
    pinnedMessageId = '',
    meName = '',
    draft = '',
    emojiPanelOpen = false,
    mentionPanelOpen = false,
    participants = [],
    connected = true,
    syncLabel = '',
    syncState = '',
    messageCount = null,
    typing = false,
    typingName = '主持 AI',
    typingLabel = '正在思考...',
    streamingText = '',
    streamingName = '主持 AI',
    streamingLabel = '回复中...',
    emptyText = '还没有消息，先发一句试试看。',
    showMessageActions = true,
    showAiOrganize = true,
    showQuickAiMention = true,
    placeholder = '发消息，Shift + Enter 换行',
  } = {},
) {
  if (!container) return

  const normalizedMessages = messages.map(normalizeChatMessage)
  const count =
    messageCount === null || messageCount === undefined || messageCount === ''
      ? normalizedMessages.length
      : Number.isFinite(Number(messageCount))
        ? Number(messageCount)
        : normalizedMessages.length

  container.innerHTML = `
    <div class="team-chat chat-panel-app" data-role="team-chat-root" data-message-count="${escapeHtml(count)}" data-connected="${connected ? 'true' : 'false'}">
      ${renderChatHeader({ messageCount: count, connected, syncLabel, syncState })}
      <div class="team-chat__stream chat-messages" id="chat-stream" data-role="chat-stream" aria-live="polite">
        <div class="team-chat__stream-inner" data-role="chat-list">
          ${
            normalizedMessages.length
              ? normalizedMessages.map((message) => renderMessage(message, { pinnedMessageId, meName, showActions: showMessageActions })).join('')
              : renderEmptyState(emptyText)
          }
          ${typing ? renderTypingIndicator({ name: typingName, statusText: typingLabel }) : ''}
          ${streamingText ? renderStreamingMessage({ name: streamingName, statusText: streamingLabel, text: streamingText }) : ''}
        </div>
      </div>
      ${renderChatComposer({
        draft,
        emojiPanelOpen,
        mentionPanelOpen,
        participants,
        placeholder,
        showAiOrganize,
        showQuickAiMention,
      })}
    </div>
  `
}
