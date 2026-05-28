import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const previewPath = new URL('../public/design-multiwindow-preview.html', import.meta.url)

test('design multiwindow preview splits design tools by game schema and vibe skills', () => {
  const html = fs.readFileSync(previewPath, 'utf8')

  assert.match(html, /多窗口设计工作台/u)
  assert.match(html, /贪吃蛇/u)
  assert.match(html, /平台跳跃/u)
  assert.match(html, /无 schema/u)
  assert.match(html, /游戏结构树/u)
  assert.match(html, /结构关系图/u)
  assert.match(html, /参数检查器/u)
  assert.match(html, /Vibe Skills/u)
  assert.match(html, /作用到当前节点/u)
  assert.match(html, /没有 schema 就隐藏游戏专属窗口/u)
})
