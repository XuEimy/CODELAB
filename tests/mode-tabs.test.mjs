import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

const appPath = path.resolve(import.meta.dirname, '..', 'public', 'app.html')

test('top mode tabs expose the five PRD v2 workbench modes in order', () => {
  const html = fs.readFileSync(appPath, 'utf8')
  const dom = new JSDOM(html)
  const buttons = [...dom.window.document.querySelectorAll('#mode-tabs .mode-tab[data-mode]')]

  const order = buttons.map((button) => ({
    mode: button.getAttribute('data-mode'),
    label: (button.textContent || '').trim().replace(/\s+/g, ' '),
  }))

  assert.deepEqual(order, [
    { mode: 'chat', label: '规划' },
    { mode: 'design', label: '设计' },
    { mode: 'dev', label: '开发' },
    { mode: 'game', label: '游戏' },
    { mode: 'task', label: '任务' },
  ])

  const active = dom.window.document.querySelector('#mode-tabs .mode-tab.active')
  assert.equal(active?.getAttribute('data-mode'), 'chat')
  assert.match(html, /currentMode='chat'/u)
})
