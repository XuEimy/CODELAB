import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const appPath = path.resolve(import.meta.dirname, '..', 'public', 'app.html')

function readAppHtml() {
  return fs.readFileSync(appPath, 'utf8')
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  assert.ok(end > start, `Expected end marker after start marker: ${endMarker}`)
  return source.slice(start, end)
}

test('任务提示词编辑器同时暴露提交给 Brain 和整局重新生成入口', () => {
  const html = readAppHtml()
  const promptEditorSection = sliceBetween(
    html,
    "if(type==='prompt-editor'){",
    "} else if(type==='preview'){",
  )

  assert.match(promptEditorSection, /submitTaskPromptToBrain\(\)/u)
  assert.match(promptEditorSection, /提交给 Brain/u)
  assert.match(promptEditorSection, /regenFromPromptEditor\('/u)
  assert.match(promptEditorSection, /重新生成/u)
})
