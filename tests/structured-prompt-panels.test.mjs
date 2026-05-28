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

test('工作台完整提示词窗口与规划台同步为单卡片完整提示词视图', () => {
  const html = readAppHtml()
  const section = sliceBetween(
    html,
    'function renderStructuredPromptPanel(iid){',
    'function renderTaskChip(){',
  )

  assert.match(html, /完整提示词/u)
  assert.match(html, /pw-sp-shell/u)
  assert.match(html, /先点「AI 整理」/u)
  assert.match(html, /再点「生成智慧树」/u)
  assert.match(section, /preEl\.textContent=sp/u)
  assert.doesNotMatch(section, /const HIDDEN=/u)
  assert.doesNotMatch(section, /filtered=sp/u)
})
