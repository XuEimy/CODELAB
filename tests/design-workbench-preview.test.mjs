import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const previewPath = new URL('../public/design-workbench-preview.html', import.meta.url)

test('design workbench preview focuses on structure graph workflow for designers', () => {
  const html = fs.readFileSync(previewPath, 'utf8')

  assert.match(html, /设计工作台/u)
  assert.match(html, /游戏结构树/u)
  assert.match(html, /结构图/u)
  assert.match(html, /参数检查器/u)
  assert.match(html, /Vibe 映射/u)
  assert.match(html, /作用到子树/u)
})
