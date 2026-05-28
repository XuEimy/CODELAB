import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const previewPath = new URL('../public/design-system-preview.html', import.meta.url)

test('design system preview explains the universal parameter framework', () => {
  const html = fs.readFileSync(previewPath, 'utf8')

  assert.match(html, /通用参数框架/u)
  assert.match(html, /游戏 schema/u)
  assert.match(html, /vibe 语义层/u)
  assert.match(html, /角色 Actor/u)
  assert.match(html, /能力 Ability/u)
})
