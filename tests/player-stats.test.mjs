import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import { buildPlayerStatsModel, renderPlayerStatsWindow } from '../public/player-stats.js'

test('buildPlayerStatsModel returns the PRD W06 metric cards and contribution leaderboard', () => {
  const now = new Date('2026-03-22T12:00:00+08:00').getTime()
  const model = buildPlayerStatsModel({
    now,
    sessionStartTime: now - 2 * 60 * 60 * 1000 - 14 * 60 * 1000,
    users: [
      { id: 'u1', name: '玩家8309', typing: true, viewing: false },
      { id: 'u2', name: 'Mint', typing: false, viewing: true },
      { id: 'u3', name: 'Rin', typing: false, viewing: false },
    ],
    contributions: [
      { userId: 'u1', name: '玩家8309', count: 342 },
      { userId: 'u2', name: 'Mint', count: 218 },
      { userId: 'u3', name: 'Rin', count: 156 },
      { userId: 'u4', name: 'Zero', count: 0 },
    ],
    messages: [
      { name: '玩家8309', text: '这里改一下' },
      { name: '玩家8309', text: '我来跑一下' },
      { name: 'Mint', text: '好的' },
    ],
    totalRuns: 5,
    totalRequests: 8,
  })

  assert.deepEqual(model.cards.map((card) => card.label), [
    '在线协作者',
    '代码行数',
    'AI 对话',
    '预览运行',
  ])
  assert.equal(model.cards[0].value, 3)
  assert.equal(model.cards[1].value, 716)
  assert.equal(model.cards[2].value, 8)
  assert.equal(model.cards[3].value, 5)
  assert.equal(model.leaderboards[0].title, '贡献排行')
  assert.deepEqual(model.leaderboards[0].rows.map((row) => row.name), [
    '玩家8309',
    'Mint',
    'Rin',
  ])
  assert.equal(model.leaderboards[0].rows[0].fill, 100)
  assert.equal(model.duration.title, '在线时长')
  assert.match(model.duration.valueLabel, /2h 14m/u)
})

test('renderPlayerStatsWindow renders the PRD leaderboard and duration section', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')
  const model = buildPlayerStatsModel({
    now: new Date('2026-03-22T12:00:00+08:00').getTime(),
    sessionStartTime: new Date('2026-03-22T10:00:00+08:00').getTime(),
    users: [{ id: 'u1', name: '玩家8309' }],
    contributions: [
      { userId: 'u1', name: '玩家8309', count: 342 },
      { userId: 'u2', name: 'Mint', count: 218 },
      { userId: 'u3', name: 'Rin', count: 156 },
    ],
    totalRuns: 5,
    totalRequests: 8,
  })

  renderPlayerStatsWindow(root, model)

  assert.match(root.textContent || '', /PLAYER STATS/u)
  assert.match(root.textContent || '', /贡献排行/u)
  assert.match(root.textContent || '', /在线时长/u)
  assert.equal(root.querySelectorAll('.ps-card').length, 4)
  assert.equal(root.querySelectorAll('.ps-rank-row').length, 3)
  assert.equal(root.querySelectorAll('.ps-rank-fill').length, 3)
  assert.equal(root.querySelectorAll('.ps-duration').length, 1)
  assert.equal(root.querySelector('[data-ps="card-1"]')?.textContent, '716')
})

test('renderPlayerStatsWindow shows the empty-state skeleton copy before live data arrives', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderPlayerStatsWindow(root, buildPlayerStatsModel())

  assert.match(root.textContent || '', /开始协作后数据将自动更新/u)
  assert.equal(root.querySelectorAll('.ps-card-num').length, 4)
  assert.equal(root.querySelectorAll('.ps-skeleton').length, 1)
  assert.equal(root.querySelectorAll('.ps-rank-row').length, 0)
})
