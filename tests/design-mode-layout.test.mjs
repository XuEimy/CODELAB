import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(import.meta.dirname, '..', 'public', 'app.html')

test('design mode defines the PRD v2 overview tree agent preview panes', () => {
  const html = fs.readFileSync(appPath, 'utf8')

  assert.match(html, /id:'design-tree'/u)
  assert.match(html, /id:'design-graph'/u)
  assert.match(html, /id:'design-vibe'/u)
  assert.match(html, /id:'web-design'/u)
  assert.match(html, /design:\['design-tree','design-graph','design-vibe','web-design','preview'\]/u)
  assert.match(html, /name:'游戏概览'/u)
  assert.match(html, /name:'智慧树'/u)
  assert.match(html, /name:'设计 Agent'/u)
  assert.match(html, /name:'设计预览'/u)
  assert.match(html, /name:'游戏预览'/u)
  assert.doesNotMatch(html, /name:'共创画布'/u)
  assert.doesNotMatch(html, /name:'结构与布局'/u)
})
