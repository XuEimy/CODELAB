import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const previewPath = new URL('../public/design-tool-fusion-preview.html', import.meta.url)

test('design tool fusion preview splits the system into multiple cooperating windows', () => {
  const html = fs.readFileSync(previewPath, 'utf8')

  assert.match(html, /参数目录窗/u)
  assert.match(html, /对象检查器/u)
  assert.match(html, /vibe 控制窗/u)
  assert.match(html, /已影响 8 个参数/u)
  assert.match(html, /游戏 schema 仍在底层/u)
  assert.match(html, /植物 > 樱桃炸弹/u)
})
