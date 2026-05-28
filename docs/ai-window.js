function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, '&#10;')
}

function slugify(value, fallback = 'item') {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
}

function normalizeMode(mode) {
  return Object.hasOwn(AI_CONTEXT_BADGES, mode) ? mode : 'code'
}

function normalizeSuggestion(suggestion, index = 0) {
  if (typeof suggestion === 'string') {
    return {
      id: `suggestion-${index}-${slugify(suggestion, 'suggestion')}`,
      label: suggestion,
      prompt: suggestion,
      action: 'use-ai-suggestion',
    }
  }

  const label = suggestion?.label || suggestion?.prompt || `建议 ${index + 1}`
  return {
    id: suggestion?.id || `suggestion-${index}-${slugify(label, 'suggestion')}`,
    label,
    prompt: suggestion?.prompt || label,
    action: suggestion?.action || 'use-ai-suggestion',
  }
}

function normalizeMessage(message, index = 0) {
  const role = ['user', 'assistant', 'system'].includes(message?.role) ? message.role : 'assistant'
  const fallbackAuthor = role === 'user' ? '我' : role === 'system' ? '系统' : 'AI 助手'
  return {
    id: message?.id || `message-${index + 1}`,
    role,
    author: message?.author || fallbackAuthor,
    text: String(message?.text ?? ''),
    meta: String(message?.meta ?? ''),
  }
}

function normalizeComposer(composer = {}) {
  return {
    placeholder: composer.placeholder || '描述你的想法...',
    value: composer.value || '',
    sendLabel: composer.sendLabel || '发送',
    helperText: composer.helperText || '',
  }
}

function normalizeSkill(skill, index = 0) {
  if (typeof skill === 'string') {
    return {
      id: `skill-${index}-${slugify(skill, 'skill')}`,
      label: skill,
      action: 'use-design-skill',
    }
  }

  const label = skill?.label || `技能 ${index + 1}`
  return {
    id: skill?.id || `skill-${index}-${slugify(label, 'skill')}`,
    label,
    action: skill?.action || 'use-design-skill',
  }
}

function normalizeCardAction(action, index = 0) {
  if (typeof action === 'string') {
    return {
      id: `card-action-${index}-${slugify(action, 'action')}`,
      label: action,
      action: 'focus-design-card',
    }
  }

  const label = action?.label || `操作 ${index + 1}`
  return {
    id: action?.id || `card-action-${index}-${slugify(label, 'action')}`,
    label,
    action: action?.action || 'focus-design-card',
  }
}

function normalizeCard(card, index = 0) {
  const title = card?.title || `设计卡片 ${index + 1}`
  return {
    id: card?.id || `design-card-${index}-${slugify(title, 'card')}`,
    eyebrow: card?.eyebrow || 'Design',
    title,
    description: card?.description || '',
    tags: Array.isArray(card?.tags) ? card.tags.map((tag) => String(tag)) : [],
    actions: Array.isArray(card?.actions) ? card.actions.map(normalizeCardAction) : [],
  }
}

export const AI_CONTEXT_BADGES = {
  code: '代码模式',
  design: '设计模式',
  task: '任务模式',
}

export const AI_CONTEXT_MODES = Object.entries(AI_CONTEXT_BADGES).map(([id, label]) => ({ id, label }))

export const DEFAULT_AI_SUGGESTIONS = [
  '加排行榜',
  '双人对战',
  '加道具',
  '换主题',
  '优化性能',
]

export function createAiWindowModel(options = {}) {
  const mode = normalizeMode(options.mode)
  const suggestions = Array.isArray(options.suggestions) && options.suggestions.length > 0
    ? options.suggestions.map(normalizeSuggestion)
    : DEFAULT_AI_SUGGESTIONS.map(normalizeSuggestion)

  return {
    mode,
    contextLabel: AI_CONTEXT_BADGES[mode],
    title: options.title || 'AI 助手',
    subtitle: options.subtitle || '',
    modes: AI_CONTEXT_MODES.map((item) => ({ ...item, active: item.id === mode })),
    suggestions,
    messages: Array.isArray(options.messages) ? options.messages.map(normalizeMessage) : [],
    composer: normalizeComposer(options.composer),
    emptyTitle: options.emptyTitle || '等待新的想法',
    emptyDescription: options.emptyDescription || '输入你的需求，或者点一下上方推荐建议开始。',
  }
}

export function createDesignAgentModel(options = {}) {
  const base = createAiWindowModel({
    ...options,
    mode: options.mode || 'design',
    title: options.title || '设计 Agent',
  })

  return {
    ...base,
    skills: Array.isArray(options.skills) ? options.skills.map(normalizeSkill) : [],
    cards: Array.isArray(options.cards) ? options.cards.map(normalizeCard) : [],
  }
}

export function renderAiWindowHeader(model) {
  const safeSubtitle = model.subtitle
    ? `<p class="ai-window__subtitle">${escapeHtml(model.subtitle)}</p>`
    : ''

  return `
    <header class="ai-window__header">
      <div class="ai-window__heading">
        <div class="ai-window__eyebrow">PRD Agent Shell</div>
        <div class="ai-window__title-row">
          <h2 class="ai-window__title">${escapeHtml(model.title)}</h2>
          <span class="ai-window__context-badge" data-ai-context="${escapeAttribute(model.mode)}">${escapeHtml(model.contextLabel)}</span>
        </div>
        ${safeSubtitle}
      </div>
      <div class="ai-window__mode-switch" role="tablist" aria-label="AI 上下文模式">
        ${model.modes.map((item) => `
          <button
            type="button"
            class="ai-window__mode-pill${item.active ? ' is-active' : ''}"
            data-action="set-ai-mode"
            data-mode="${escapeAttribute(item.id)}"
            aria-pressed="${item.active ? 'true' : 'false'}"
          >${escapeHtml(item.label)}</button>
        `).join('')}
      </div>
    </header>
  `.trim()
}

export function renderAiSuggestionBar(suggestions = []) {
  const items = suggestions.map(normalizeSuggestion)

  return `
    <section class="ai-window__suggestions" aria-label="推荐建议">
      <div class="ai-window__suggestions-label">推荐</div>
      <div class="ai-window__suggestion-rail">
        ${items.map((item) => `
          <button
            type="button"
            class="ai-window__suggestion-pill"
            data-action="${escapeAttribute(item.action)}"
            data-suggestion-id="${escapeAttribute(item.id)}"
            data-prompt="${escapeAttribute(item.prompt)}"
          >${escapeHtml(item.label)}</button>
        `).join('')}
      </div>
    </section>
  `.trim()
}

export function renderAiMessageStreamShell(messages = [], options = {}) {
  const items = messages.map(normalizeMessage)

  if (items.length === 0) {
    return `
      <section class="ai-window__stream" aria-live="polite">
        <div class="ai-window__empty">
          <strong>${escapeHtml(options.emptyTitle || '等待新的想法')}</strong>
          <p>${escapeHtml(options.emptyDescription || '输入你的需求，或者点一下上方推荐建议开始。')}</p>
        </div>
      </section>
    `.trim()
  }

  return `
    <section class="ai-window__stream" aria-live="polite">
      ${items.map((message) => `
        <article
          class="ai-window__message ai-window__message--${escapeAttribute(message.role)}"
          data-message-id="${escapeAttribute(message.id)}"
          data-ai-role="${escapeAttribute(message.role)}"
        >
          <div class="ai-window__message-meta">
            <strong>${escapeHtml(message.author)}</strong>
            ${message.meta ? `<span>${escapeHtml(message.meta)}</span>` : ''}
          </div>
          <div class="ai-window__bubble">${escapeHtml(message.text).replace(/\n/g, '<br>')}</div>
        </article>
      `).join('')}
    </section>
  `.trim()
}

export function renderAiComposerShell(composer = {}) {
  const model = normalizeComposer(composer)
  const helper = model.helperText
    ? `<div class="ai-window__composer-helper">${escapeHtml(model.helperText)}</div>`
    : ''

  return `
    <section class="ai-window__composer">
      <label class="ai-window__composer-field">
        <span class="ai-window__composer-label">输入</span>
        <textarea
          class="ai-window__composer-input"
          rows="1"
          placeholder="${escapeAttribute(model.placeholder)}"
          data-role="ai-composer-input"
        >${escapeHtml(model.value)}</textarea>
      </label>
      <div class="ai-window__composer-row">
        ${helper}
        <button type="button" class="ai-window__send" data-action="send-ai-message">${escapeHtml(model.sendLabel)}</button>
      </div>
    </section>
  `.trim()
}

export function renderAiWindow(modelInput = {}) {
  const model = createAiWindowModel(modelInput)
  return `
    <section class="ai-window" data-ai-mode="${escapeAttribute(model.mode)}">
      ${renderAiWindowHeader(model)}
      ${renderAiSuggestionBar(model.suggestions)}
      ${renderAiMessageStreamShell(model.messages, model)}
      ${renderAiComposerShell(model.composer)}
    </section>
  `.trim()
}

export function renderDesignCard(cardInput = {}) {
  const card = normalizeCard(cardInput)
  const tags = card.tags.length > 0
    ? `<div class="ai-window__design-tags">${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>`
    : ''
  const actions = card.actions.length > 0
    ? `<div class="ai-window__design-actions">${card.actions.map((action) => `
        <button
          type="button"
          class="ai-window__design-action"
          data-action="${escapeAttribute(action.action)}"
          data-design-card-id="${escapeAttribute(card.id)}"
          data-design-action-id="${escapeAttribute(action.id)}"
        >${escapeHtml(action.label)}</button>
      `).join('')}</div>`
    : ''

  return `
    <article class="ai-window__design-card" data-design-card-id="${escapeAttribute(card.id)}">
      <div class="ai-window__design-card-head">
        <span class="ai-window__design-eyebrow">${escapeHtml(card.eyebrow)}</span>
        <strong>${escapeHtml(card.title)}</strong>
      </div>
      <p class="ai-window__design-copy">${escapeHtml(card.description)}</p>
      ${tags}
      ${actions}
    </article>
  `.trim()
}

export function renderDesignAgentShell(modelInput = {}) {
  const model = createDesignAgentModel(modelInput)
  const skillRail = model.skills.length > 0
    ? `
      <section class="ai-window__skills" aria-label="设计技能">
        ${model.skills.map((skill) => `
          <button
            type="button"
            class="ai-window__skill-pill"
            data-action="${escapeAttribute(skill.action)}"
            data-skill-id="${escapeAttribute(skill.id)}"
          >${escapeHtml(skill.label)}</button>
        `).join('')}
      </section>
    `
    : ''
  const cards = model.cards.length > 0
    ? `<section class="ai-window__design-grid">${model.cards.map(renderDesignCard).join('')}</section>`
    : ''

  return `
    <section class="ai-window ai-window--design-agent" data-ai-mode="${escapeAttribute(model.mode)}">
      ${renderAiWindowHeader(model)}
      ${skillRail.trim()}
      ${cards}
      ${renderAiComposerShell(model.composer)}
    </section>
  `.trim()
}

export function mountAiWindow(root, modelInput = {}) {
  if (!root) throw new Error('mountAiWindow requires a root element')
  root.innerHTML = renderAiWindow(modelInput)
  return root.firstElementChild
}
