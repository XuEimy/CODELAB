import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

import { buildTeamDashboardModel, renderTeamDashboard } from '../public/team-dashboard.js'

const appPath = path.resolve(import.meta.dirname, '..', 'public', 'app.html')

function readAppHtml() {
  return fs.readFileSync(appPath, 'utf8')
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  assert.ok(end > start, `Expected end marker after start marker: ${endMarker}`)
  return source.slice(start, end)
}

test('buildTeamDashboardModel summarizes online members and shared sessions', () => {
  const model = buildTeamDashboardModel({
    localUserId: 'u1',
    activeMode: 'pw-u1',
    users: [
      { id: 'u1', name: 'Una', mode: 'pw-u1', color: 0 },
      { id: 'u2', name: '路人乙', mode: 'dev', color: 1 },
    ],
    workspaceEntries: [
      { userId: 'u1', userName: 'Una', taskLabel: '像素坦克大战', catLabel: '玩法机制' },
      { userId: 'u2', userName: '路人乙', taskLabel: '战斗 UI', catLabel: '体验设计' },
    ],
    visibleWindowsByUser: {
      u1: [
        { id: 'task-info', name: '任务栏' },
        { id: 'prompt-editor', name: '提示词编辑器' },
        { id: 'preview', name: '游戏预览' },
      ],
      u2: [
        { id: 'editor', name: '代码编辑器' },
        { id: 'preview', name: '游戏预览' },
      ],
    },
    sharedSessions: [
      {
        id: 'sw-1',
        sourceInstanceId: 'prompt-editor@u1',
        winType: 'prompt-editor',
        winName: '提示词编辑器',
        owner: { id: 'u1', name: 'Una' },
        participants: [
          { id: 'u1', name: 'Una', online: true },
          { id: 'u2', name: '路人乙', online: true },
        ],
      },
    ],
  })

  assert.equal(model.summary.onlineCount, 2)
  assert.equal(model.summary.sharedCount, 1)
  assert.equal(model.members[0].name, 'Una')
  assert.equal(model.members[0].isMe, true)
  assert.equal(model.members[0].isActive, true)
  assert.equal(model.members[0].modeLabel, '工作台')
  assert.equal(model.members[0].contextLabel, '玩法机制 · 像素坦克大战')
  assert.equal(model.members[0].windowCount, 3)
  assert.equal(model.members[0].focusWindowLabel, '任务栏')
  assert.equal(model.members[0].sharedCount, 1)
  assert.equal(model.sessions[0].windowLabel, '提示词编辑器')
  assert.equal(model.sessions[0].ownerName, 'Una')
  assert.equal(model.sessions[0].onlineCount, 2)
  assert.equal(model.sessions[0].actionLabel, '打开共享窗口')
})

test('renderTeamDashboard renders member and shared-session sections', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderTeamDashboard(
    root,
    buildTeamDashboardModel({
      localUserId: 'u1',
      activeMode: 'pw-u1',
      users: [
        { id: 'u1', name: 'Una', mode: 'pw-u1', color: 0 },
        { id: 'u2', name: '路人乙', mode: 'design', color: 1 },
      ],
      workspaceEntries: [
        { userId: 'u1', userName: 'Una', taskLabel: '像素坦克大战', catLabel: '玩法机制' },
      ],
      visibleWindowsByUser: {
        u1: [
          { id: 'task-info', name: '任务栏' },
          { id: 'preview', name: '游戏预览' },
        ],
        u2: [{ id: 'design-vibe', name: '设计 Agent' }],
      },
      sharedSessions: [
        {
          id: 'sw-1',
          sourceInstanceId: 'preview@u1',
          winType: 'preview',
          winName: '游戏预览',
          owner: { id: 'u1', name: 'Una' },
          participants: [
            { id: 'u1', name: 'Una', online: true },
            { id: 'u2', name: '路人乙', online: true },
          ],
        },
      ],
    }),
  )

  assert.match(root.innerHTML, /在线成员/u)
  assert.match(root.innerHTML, /共享窗口/u)
  assert.equal(root.querySelectorAll('.team-dashboard__member-card').length, 2)
  assert.equal(root.querySelectorAll('.team-dashboard__session-card').length, 1)
  assert.equal(root.querySelector('[data-team-user-id="u2"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-session-id="sw-1"]') instanceof dom.window.HTMLElement, true)
  assert.match(root.innerHTML, /任务栏/u)
  assert.match(root.innerHTML, /打开共享窗口/u)
})

test('app wires personal-ws through the shared team dashboard module', () => {
  const html = readAppHtml()
  const section = sliceBetween(
    html,
    "} else if(type==='personal-ws'){",
    "} else if(type==='task-info'){",
  )

  assert.match(html, /from '\/team-dashboard\.js'/u)
  assert.match(section, /team-dashboard-root/u)
  assert.match(section, /renderMyDashboard\(\)/u)
  assert.doesNotMatch(section, /renderStructuredPromptPanel/u)
})
