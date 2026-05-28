import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const planPath = path.resolve(import.meta.dirname, '..', 'public', 'plan.html')

function readPlanHtml() {
  return fs.readFileSync(planPath, 'utf8')
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  assert.ok(end > start, `Expected end marker after start marker: ${endMarker}`)
  return source.slice(start, end)
}

test('AI 整理只更新摘要，不再直接生成智慧树或提示词预览', () => {
  const html = readPlanHtml()
  const section = sliceBetween(
    html,
    'const handleRefreshSummary = useCallback(() => {',
    '  const handleGenerateWisdomTree = useCallback(() => {',
  )

  assert.doesNotMatch(section, /saveTree\(/u)
  assert.doesNotMatch(section, /lastStructuredPrompt/u)
  assert.doesNotMatch(section, /structuredPromptAt/u)
})

test('规划台暴露独立的生成智慧树按钮和多人同步占用状态', () => {
  const html = readPlanHtml()

  assert.match(html, /生成智慧树/u)
  assert.match(html, /setLocalStateField\('generatingTree'/u)
  assert.match(html, /generatingTreeBy/u)
  assert.match(html, /isGeneratingTree/u)
})

test('提示词预览窗口简化为完整提示词引导和单卡片展示', () => {
  const html = readPlanHtml()
  const section = sliceBetween(
    html,
    'function PromptPreviewPanel({',
    '/* === WISDOM TREE (horizontal flow mind-map) === */',
  )

  assert.match(section, /先点「AI 整理」/u)
  assert.match(section, /再点「生成智慧树」/u)
  assert.match(section, /完整提示词/u)
  assert.match(section, /prompt-preview__/u)
  assert.doesNotMatch(section, /智慧树预览/u)
  assert.doesNotMatch(section, /提示词摘要/u)
})
