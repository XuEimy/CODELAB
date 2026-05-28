import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const previewPath = new URL('../public/design-visual-tree-studio-preview.html', import.meta.url)

test('design visual tree studio preview mirrors the PRD v2 overview tree and design preview framing', () => {
  const html = fs.readFileSync(previewPath, 'utf8')

  assert.match(html, /游戏概览/u)
  assert.match(html, /智慧树/u)
  assert.match(html, /设计 Agent/u)
  assert.match(html, /设计预览/u)
  assert.match(html, /游戏预览/u)
  assert.match(html, /node-canvas--visual/u)
  assert.match(html, /Boss 战节奏/u)
  assert.doesNotMatch(html, /角色 > 蛇身/u)
  assert.doesNotMatch(html, /Web\/UI > Hero/u)
  assert.doesNotMatch(html, /行为与节奏/u)
  assert.doesNotMatch(html, /表现与反馈/u)
})
