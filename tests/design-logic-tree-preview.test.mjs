import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const previewPath = new URL('../public/design-logic-tree-preview.html', import.meta.url)

test('design logic tree preview uses the PRD v2 overview tree and design agent language', () => {
  const html = fs.readFileSync(previewPath, 'utf8')

  assert.match(html, /智慧树/u)
  assert.match(html, /游戏概览/u)
  assert.match(html, /设计 Agent/u)
  assert.match(html, /node-canvas/u)
  assert.match(html, /Hero 区/u)
  assert.match(html, /Boss 战节奏/u)
  assert.doesNotMatch(html, /角色 > 蛇身/u)
  assert.doesNotMatch(html, /Web\/UI > Hero/u)
})
