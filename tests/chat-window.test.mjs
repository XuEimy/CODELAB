import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import {
  CHAT_EMOJIS,
  buildAiPromptFromMessage,
  buildAiSummaryPromptFromMessages,
  autoSizeChatTextarea,
  createChatMessage,
  normalizeChatMessage,
  renderChatHeaderContent,
  renderChatMessageContent,
  renderStreamingMessageContent,
  renderTypingIndicatorContent,
  renderTeamChatWindow,
} from '../public/chat-window.js'

test('createChatMessage creates stable chat records with ids and timestamps', () => {
  const message = createChatMessage({
    name: '玩家8309',
    text: '这个按钮可以再大一点',
    color: 2,
  })

  assert.equal(message.name, '玩家8309')
  assert.equal(message.text, '这个按钮可以再大一点')
  assert.equal(typeof message.id, 'string')
  assert.equal(typeof message.createdAt, 'number')
  assert.equal(message.kind, 'text')
  assert.equal(message.role, 'human')
})

test('normalizeChatMessage preserves legacy emoji messages and marks AI rows', () => {
  const legacy = normalizeChatMessage({ name: 'Mint', text: '收到', color: 1 })
  const emoji = normalizeChatMessage({
    id: 's1',
    name: 'Rin',
    text: '灵感',
    color: 0,
    kind: 'sticker',
    stickerId: 'sparkles',
    createdAt: 1,
  })
  const ai = normalizeChatMessage({ id: 'ai-1', role: 'ai', text: '我来整理一下' })

  assert.equal(legacy.kind, 'text')
  assert.equal(emoji.kind, 'emoji')
  assert.equal(emoji.stickerId, 'sparkles')
  assert.equal(ai.role, 'ai')
  assert.equal(ai.name, '主持 AI')
})

test('buildAiPromptFromMessage turns a chat message into an actionable AI prompt', () => {
  const prompt = buildAiPromptFromMessage({
    name: '玩家8309',
    text: '把开始按钮再大一点，颜色更亮',
  })

  assert.match(prompt, /团队聊天消息/u)
  assert.match(prompt, /开始按钮/u)
})

test('buildAiSummaryPromptFromMessages condenses multiple chat messages into a summarization prompt', () => {
  const prompt = buildAiSummaryPromptFromMessages(
    [
      createChatMessage({ name: '玩家8309', text: '把开始按钮再大一点' }),
      createChatMessage({ role: 'ai', name: '主持 AI', text: '我建议先加一个热区' }),
    ],
    { roomName: '团队聊天' },
  )

  assert.match(prompt, /团队聊天/u)
  assert.match(prompt, /开始按钮再大一点/u)
  assert.match(prompt, /热区/u)
  assert.match(prompt, /待执行项/u)
})

test('renderTeamChatWindow renders the PRD-aligned chat frame with header, rows, panels, and streaming hooks', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')
  const messages = [
    createChatMessage({ id: 'm1', name: '玩家8309', text: '这个按钮再大一点', color: 0, createdAt: 1 }),
    createChatMessage({ id: 'm2', name: '主持 AI', text: '我帮你整理一下', role: 'ai', color: 1, createdAt: 2 }),
    createChatMessage({
      id: 'm3',
      name: 'Rin',
      text: '✨',
      color: 2,
      kind: 'emoji',
      stickerId: 'sparkles',
      createdAt: 3,
    }),
  ]

  renderTeamChatWindow(root, {
    messages,
    pinnedMessageId: 'm1',
    meName: '玩家8309',
    draft: '@Mint',
    emojiPanelOpen: true,
    mentionPanelOpen: true,
    typing: true,
    streamingText: '正在生成摘要...',
    participants: [
      { id: 'u1', name: '玩家8309' },
      { id: 'u2', name: 'Mint' },
      { id: 'u3', name: 'Rin' },
    ],
  })

  assert.equal(root.querySelectorAll('.team-chat__msg').length, 3)
  assert.equal(root.querySelector('.chat-header-count')?.textContent?.includes('3 条消息'), true)
  assert.equal(root.querySelector('.chat-header-sync')?.textContent?.includes('同步中'), true)
  assert.equal(root.querySelectorAll('.msg.me').length, 2)
  assert.equal(root.querySelectorAll('[data-role="chat-message"][data-author-role="ai"]').length, 1)
  assert.equal(root.querySelector('.typing-indicator') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.team-chat__streaming') instanceof dom.window.HTMLElement, true)
  assert.match(root.innerHTML, /发给 AI/u)
  assert.match(root.innerHTML, /转任务/u)
  assert.match(root.innerHTML, /删除/u)
  assert.equal(root.querySelector('.team-chat__stream') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.team-chat__dock') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.team-chat__composer') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.team-chat__textarea') instanceof dom.window.HTMLTextAreaElement, true)
  assert.equal(root.querySelector('.team-chat__emoji-panel') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.team-chat__mention-panel') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-action="ai-organize"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-action="insert-ai-mention"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-action="toggle-emojis"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-action="toggle-mentions"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelectorAll('.team-chat__emoji-btn').length, CHAT_EMOJIS.length)
  assert.equal(CHAT_EMOJIS.length >= 16, true)
  assert.equal(root.querySelectorAll('.team-chat__mention-item').length, 4)
  assert.equal(root.querySelector('.team-chat__textarea')?.value, '@Mint')
  assert.equal(root.innerHTML.indexOf('team-chat__composer-main') < root.innerHTML.indexOf('team-chat__toolbar'), true)
  assert.equal(root.querySelector('[data-message-id="m1"]')?.getAttribute('data-self'), 'true')
  assert.equal(root.querySelector('[data-message-id="m2"]')?.getAttribute('data-author-role'), 'ai')
})

test('renderChatHeaderContent, renderChatMessageContent, and indicator helpers expose reusable markup blocks', () => {
  const header = renderChatHeaderContent({ messageCount: 12, connected: true })
  const message = renderChatMessageContent(createChatMessage({ name: 'Mint', text: '收到', createdAt: 1 }))
  const typing = renderTypingIndicatorContent()
  const streaming = renderStreamingMessageContent({ text: '内容正在生成' })

  assert.match(header, /12 条消息/u)
  assert.match(message, /msg-bub-player/u)
  assert.match(typing, /typing-indicator/u)
  assert.match(streaming, /streaming-message/u)
})

test('autoSizeChatTextarea clamps height and toggles overflow', () => {
  const dom = new JSDOM('<textarea></textarea>')
  const textarea = dom.window.document.querySelector('textarea')
  Object.defineProperty(textarea, 'scrollHeight', {
    configurable: true,
    value: 148,
  })

  const height = autoSizeChatTextarea(textarea, { minHeight: 40, maxHeight: 100 })

  assert.equal(height, 100)
  assert.equal(textarea.style.height, '100px')
  assert.equal(textarea.style.overflowY, 'auto')
})
