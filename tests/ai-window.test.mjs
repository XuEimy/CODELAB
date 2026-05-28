import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import {
  AI_CONTEXT_BADGES,
  DEFAULT_AI_SUGGESTIONS,
  createAiWindowModel,
  createDesignAgentModel,
  mountAiWindow,
  renderAiComposerShell,
  renderAiSuggestionBar,
  renderAiWindowHeader,
  renderDesignAgentShell,
  renderDesignCard,
} from '../public/ai-window.js'

test('createAiWindowModel normalizes modes, suggestions, messages, and composer defaults', () => {
  const model = createAiWindowModel({
    mode: 'design',
    title: 'W03 AI 助手',
    suggestions: ['梳理结构树', { label: '补技能清单', prompt: '补一份技能清单' }],
    messages: [
      { id: 'u1', role: 'user', author: '玩家8309', text: '想做一个更清晰的设计面板' },
      { id: 'a1', role: 'assistant', author: 'AI 助手', text: '可以先把模块边界拆出来。' },
    ],
  })

  assert.equal(model.mode, 'design')
  assert.equal(model.contextLabel, AI_CONTEXT_BADGES.design)
  assert.equal(model.suggestions.length, 2)
  assert.equal(model.suggestions[0].label, '梳理结构树')
  assert.equal(model.suggestions[0].prompt, '梳理结构树')
  assert.equal(model.messages[0].role, 'user')
  assert.equal(model.messages[1].role, 'assistant')
  assert.equal(model.composer.sendLabel, '发送')
  assert.equal(model.composer.placeholder, '描述你的想法...')
  assert.equal(Array.isArray(DEFAULT_AI_SUGGESTIONS), true)
  assert.equal(DEFAULT_AI_SUGGESTIONS.length >= 4, true)
})

test('render helpers expose reusable header, suggestion, stream, and composer actions', () => {
  const header = renderAiWindowHeader(
    createAiWindowModel({
      mode: 'task',
      title: '任务 Agent',
      subtitle: '正在处理 W03',
    }),
  )
  const suggestions = renderAiSuggestionBar([
    { label: '加排行榜', prompt: '加一个排行榜' },
    { label: '换主题', prompt: '换成太空主题的视觉风格' },
  ])
  const composer = renderAiComposerShell({
    placeholder: '继续补充任务细节...',
    value: '先保留现有样式',
  })

  assert.match(header, /任务模式/u)
  assert.match(header, /data-ai-context="task"/u)
  assert.match(header, /data-action="set-ai-mode"/u)
  assert.match(suggestions, /data-action="use-ai-suggestion"/u)
  assert.match(suggestions, /data-prompt="加一个排行榜"/u)
  assert.match(composer, /textarea/u)
  assert.match(composer, /data-action="send-ai-message"/u)
})

test('mountAiWindow renders a complete assistant shell with escaped messages and composer shell', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  mountAiWindow(root, {
    mode: 'code',
    title: 'AI 助手',
    subtitle: '当前上下文：贪吃蛇游戏',
    suggestions: ['加道具', '优化性能'],
    messages: [
      { id: 'm1', role: 'assistant', author: 'AI 助手', text: '你好，先看一下当前结构。' },
      { id: 'm2', role: 'user', author: '玩家8309', text: '<script>alert(1)</script>' },
    ],
    composer: {
      value: '请把逻辑拆成模块',
      helperText: 'Enter 发送，Shift + Enter 换行',
    },
  })

  assert.equal(root.querySelector('.ai-window') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.ai-window__header') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.ai-window__suggestions') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.ai-window__stream') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.ai-window__composer') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelectorAll('.ai-window__message').length, 2)
  assert.equal(root.querySelector('[data-action="send-ai-message"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-action="use-ai-suggestion"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.innerHTML.includes('<script>alert(1)</script>'), false)
  assert.match(root.innerHTML, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/u)
})

test('design agent helpers render reusable design cards and skill pills for later wiring', () => {
  const cardHtml = renderDesignCard({
    id: 'structure-tree',
    eyebrow: '结构图',
    title: '游戏结构树',
    description: '把 W14 设计 Agent 的焦点拆成可复用卡片。',
    tags: ['W14', 'Graph'],
    actions: [
      { label: '聚焦', action: 'focus-design-card' },
      { label: '应用', action: 'apply-design-card' },
    ],
  })

  assert.match(cardHtml, /data-design-card-id="structure-tree"/u)
  assert.match(cardHtml, /data-action="focus-design-card"/u)
  assert.match(cardHtml, /data-action="apply-design-card"/u)

  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')
  const model = createDesignAgentModel({
    mode: 'design',
    title: '设计 Agent',
    subtitle: 'W14 reusable shell',
    skills: [
      { id: 'tree', label: '结构树' },
      { id: 'prompt', label: 'Prompt 草图' },
    ],
    cards: [
      {
        id: 'structure-tree',
        eyebrow: '结构图',
        title: '游戏结构树',
        description: '展示模块、依赖与上下文。',
      },
      {
        id: 'prompt-lab',
        eyebrow: 'Prompt',
        title: 'Prompt Workbench',
        description: '整理建议、上下文和行动项。',
      },
    ],
  })

  root.innerHTML = renderDesignAgentShell(model)

  assert.equal(root.querySelector('.ai-window--design-agent') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelectorAll('.ai-window__design-card').length, 2)
  assert.equal(root.querySelectorAll('[data-action="use-design-skill"]').length, 2)
  assert.match(root.textContent, /设计模式/u)
  assert.match(root.textContent, /结构树/u)
})
