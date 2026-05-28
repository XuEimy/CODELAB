import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import {
  ACTIVITY_MASCOTS,
  buildEventActivityItem,
  buildPresenceActivityItems,
  classifyActivityText,
  pickMascotVariant,
  renderActivityFeed,
} from '../public/activity-window.js'

test('pickMascotVariant is deterministic and only returns supported variants', () => {
  const variants = new Set(ACTIVITY_MASCOTS.map((variant) => variant.id))
  const first = pickMascotVariant('玩家8309')
  const second = pickMascotVariant('玩家8309')

  assert.equal(first, second)
  assert.equal(variants.has(first), true)
})

test('classifyActivityText aligns system-only activity taxonomy with PRD W05', () => {
  const enter = classifyActivityText('玩家8309 进入了工作台')
  const code = classifyActivityText('玩家8309 编辑了 src/game.js')
  const preview = classifyActivityText('玩家8309 运行了游戏预览')
  const design = classifyActivityText('玩家8309 应用了设计变更')
  const ai = classifyActivityText('玩家8309 向 AI 提问')
  const task = classifyActivityText('玩家8309 将 碰撞检测 标记为已完成')
  const chat = classifyActivityText('玩家8309: 大家看下这里')

  assert.equal(enter.eventType, 'enter-workbench')
  assert.equal(enter.isSystemEvent, true)
  assert.equal(code.eventType, 'code-edit')
  assert.equal(code.icon, 'i-code')
  assert.equal(preview.eventType, 'preview-run')
  assert.equal(design.eventType, 'design-change')
  assert.equal(ai.eventType, 'ai-request')
  assert.equal(task.eventType, 'task-complete')
  assert.equal(chat.isSystemEvent, false)
  assert.equal(chat.eventType, 'human-message')
})

test('buildPresenceActivityItems creates compact live cards for presence states', () => {
  const items = buildPresenceActivityItems([
    { id: 'u1', name: '玩家8309', typing: true, viewing: false, mode: 'dev' },
    { id: 'u2', name: 'Mint', typing: false, viewing: true, mode: 'game' },
    { id: 'u3', name: 'Rin', typing: false, viewing: false, mode: 'collab' },
  ])

  assert.equal(items.length, 3)
  assert.equal(items[0].statusKey, 'typing')
  assert.equal(items[1].statusKey, 'game')
  assert.equal(items[2].statusKey, 'idle')
})

test('buildEventActivityItem keeps unsupported chat text out of the system event stream', () => {
  const item = buildEventActivityItem({
    userId: 'u1',
    name: '玩家8309',
    text: '玩家8309: 大家看下这里',
    timestamp: '21:26:13',
  })

  assert.equal(item.isSystemEvent, false)
  assert.equal(item.eventType, 'human-message')
  assert.equal(item.source, 'event')
})

test('renderActivityFeed renders PRD-aligned empty state and system event rows', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderActivityFeed(root, [])
  assert.match(root.innerHTML, /activity-empty/u)
  assert.match(root.innerHTML, /等待第一次协作事件/u)

  renderActivityFeed(root, [
    buildEventActivityItem({
      id: 'evt-1',
      userId: 'u1',
      name: '玩家8309',
      text: '玩家8309 编辑了 src/game.js',
      timestamp: '21:26:13',
    }),
    buildEventActivityItem({
      id: 'evt-2',
      userId: 'u2',
      name: 'Mint',
      text: 'Mint 将 碰撞检测 标记为已完成',
      timestamp: '21:26:18',
    }),
    buildEventActivityItem({
      id: 'evt-3',
      userId: 'u3',
      name: 'Rin',
      text: 'Rin: 大家看下这里',
      timestamp: '21:26:20',
    }),
  ])

  assert.match(root.innerHTML, /activity-feed activity-feed--rows/u)
  assert.equal(root.querySelectorAll('.activity-row--system').length, 2)
  assert.equal(root.querySelector('.activity-row')?.querySelector('.activity-row__name')?.textContent, '玩家8309')
  assert.equal(root.querySelector('.activity-row__icon')?.getAttribute('data-icon'), 'i-code')
  assert.match(root.innerHTML, /src\/game\.js/u)
  assert.match(root.innerHTML, /系统事件/u)
  assert.doesNotMatch(root.innerHTML, /Rin: 大家看下这里/u)
})
