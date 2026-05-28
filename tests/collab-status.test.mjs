import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const projectRoot = path.resolve(import.meta.dirname, '..')
const appPath = path.join(projectRoot, 'public', 'app.html')
const modulePath = path.join(projectRoot, 'public', 'collab-status.js')

test('buildCollabStatusModel summarizes active collaborators for the stats window', async () => {
  assert.equal(fs.existsSync(modulePath), true, 'collab status module should exist')

  const moduleUrl = pathToFileURL(modulePath).href
  const { buildCollabStatusModel } = await import(moduleUrl)

  const now = new Date('2026-04-01T16:30:00+08:00').getTime()
  const model = buildCollabStatusModel({
    now,
    currentMode: 'pw-u1',
    users: [
      { id: 'u1', name: 'Una', color: 0, mode: 'pw-u1', typing: true, viewing: false },
      { id: 'u2', name: '路人乙', color: 2, mode: 'design', typing: false, viewing: true },
      { id: 'u3', name: 'Mint', color: 4, mode: 'dev', typing: false, viewing: false },
    ],
    joinTimes: new Map([
      ['u1', now - 55 * 60 * 1000],
      ['u2', now - 18 * 60 * 1000],
      ['u3', now - 6 * 60 * 1000],
    ]),
    localUserId: 'u1',
  })

  assert.equal(model.items.length, 3)
  assert.equal(model.items[0].isMe, true)
  assert.equal(model.items[0].statusLabel, '正在输入')
  assert.equal(model.items[1].statusLabel, '正在预览')
  assert.equal(model.items[2].modeLabel, '开发')
  assert.match(model.items[0].timeLabel, /\d+m/u)
})

test('renderCollabStatusWindow renders the legacy collaborator list view', async () => {
  const moduleUrl = pathToFileURL(modulePath).href
  const { buildCollabStatusModel, renderCollabStatusWindow } = await import(moduleUrl)

  const model = buildCollabStatusModel({
    now: new Date('2026-04-01T16:30:00+08:00').getTime(),
    currentMode: 'pw-u1',
    users: [
      { id: 'u1', name: 'Una', color: 0, mode: 'pw-u1', typing: true, viewing: false },
      { id: 'u2', name: '路人乙', color: 2, mode: 'design', typing: false, viewing: true },
    ],
    joinTimes: new Map([
      ['u1', Date.now() - 55 * 60 * 1000],
      ['u2', Date.now() - 18 * 60 * 1000],
    ]),
    localUserId: 'u1',
  })

  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderCollabStatusWindow(root, model)

  assert.equal(root.querySelector('.collab-list') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelectorAll('.collab-user').length, 2)
  assert.match(root.textContent || '', /Una/u)
  assert.match(root.textContent || '', /路人乙/u)
  assert.match(root.textContent || '', /正在输入/u)
  assert.match(root.textContent || '', /正在预览/u)
})

test('app wires stats window through the collab status module', () => {
  const html = fs.readFileSync(appPath, 'utf8')

  assert.match(html, /from '\/collab-status\.js'/u)
  assert.match(html, /renderCollabStatusWindow/u)
  assert.match(html, /buildCollabStatusModel/u)
})

test('app renders collab status into the active stats instance instead of a shared bare root', () => {
  const html = fs.readFileSync(appPath, 'utf8')

  assert.match(html, /const rootId=`collab-status-root-\$\{iid\}`/u)
  assert.match(html, /setTimeout\(\(\)=>renderCollabStatus\(document\.getElementById\(rootId\)\),0\)/u)
  assert.match(html, /document\.querySelectorAll\('\[id\^="collab-status-root-"\]'\)/u)
  assert.doesNotMatch(html, /const rootId=useBareIds\?'collab-status-root'/u)
})
