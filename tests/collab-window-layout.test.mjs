import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(import.meta.dirname, '..', 'public', 'app.html')

test('workspace registry keeps the PRD v2 chat, runtime, and removed-window definitions aligned', () => {
  const html = fs.readFileSync(appPath, 'utf8')

  assert.match(html, /name:'玩家统计'/u)
  assert.match(html, /chat:\['chat','activity','stats','ai'\]/u)
  assert.match(html, /dev:\['editor','preview','codemap','diff','console'\]/u)
  assert.match(html, /task:\['design-graph','task-prompt','ai','preview'\]/u)
  assert.match(html, /id:'diff',name:'变更预览'/u)
  assert.match(html, /id:'console',name:'运行日志'/u)
  assert.doesNotMatch(html, /id:'tasks'/u)
  assert.doesNotMatch(html, /id:'task-list-agent'/u)
  assert.doesNotMatch(html, /id:'mockup'/u)
  assert.doesNotMatch(html, /collab:/u)
})
