import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import {
  buildConsoleModel,
  buildDiffModel,
  normalizeConsoleEntry,
  renderRuntimeConsoleWindow,
  renderRuntimeDiffWindow,
} from '../public/runtime-windows.js'

test('buildDiffModel creates grouped file diffs and summary stats from snapshot maps', () => {
  const model = buildDiffModel({
    baselineFiles: {
      'index.html': ['function checkCollision() {', '  if (x < 0) return true;', '}', ''].join('\n'),
      'styles.css': 'body { color: #fff; }\n',
    },
    currentFiles: {
      'index.html': [
        'function checkCollision() {',
        '  if (x < 0 || x >= W) {',
        '    return true;',
        '  }',
        '}',
        '// teammate change',
        'function boundaryCheck() {}',
        '',
      ].join('\n'),
      'styles.css': 'body { color: #fff; }\n',
    },
    view: 'unified',
  })

  assert.equal(model.empty, false)
  assert.equal(model.view, 'unified')
  assert.equal(model.files.length, 1)
  assert.equal(model.files[0].path, 'index.html')
  assert.equal(model.files[0].stats.added, 5)
  assert.equal(model.files[0].stats.removed, 1)
  assert.equal(model.stats.added, 5)
  assert.equal(model.stats.removed, 1)
  assert.equal(model.stats.files, 1)
  assert.equal(model.files[0].lines.some((line) => line.type === 'add'), true)
  assert.equal(model.files[0].lines.some((line) => line.type === 'remove'), true)
})

test('renderRuntimeDiffWindow renders empty and populated diff shells with split toggle and teammate highlighting hook', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderRuntimeDiffWindow(root, buildDiffModel())
  assert.match(root.textContent, /运行游戏后，代码变更将在这里显示/u)
  assert.equal(root.querySelectorAll('.rw-diff__view-btn').length, 2)

  const model = buildDiffModel({
    baselineFiles: {
      'index.html': ['function checkCollision() {', '  if (x < 0) return true;', '}', ''].join('\n'),
    },
    currentFiles: {
      'index.html': [
        'function checkCollision() {',
        '  if (x < 0 || x >= W) {',
        '    return true;',
        '  }',
        '}',
        '// teammate change',
        '',
      ].join('\n'),
    },
    view: 'split',
  })

  renderRuntimeDiffWindow(root, model, {
    resolveLineMeta({ line }) {
      if (line.content === '// teammate change') {
        return { className: 'is-teammate', badge: 'Mint' }
      }
      return null
    },
  })

  assert.match(root.textContent, /index\.html/u)
  assert.match(root.textContent, /\+4/u)
  assert.match(root.textContent, /-1/u)
  assert.match(root.textContent, /上次运行后变更/u)
  assert.equal(root.querySelector('.rw-diff__view-btn[data-view="split"]')?.getAttribute('aria-pressed'), 'true')
  assert.equal(root.querySelectorAll('.rw-diff__file').length, 1)
  assert.equal(root.querySelector('.rw-diff__split') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.is-teammate') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.rw-diff__line-badge')?.textContent, 'Mint')
  assert.match(root.querySelector('.rw-diff__footer')?.textContent || '', /1 个文件/u)
})

test('normalizeConsoleEntry and buildConsoleModel preserve counts, filtering, and jump metadata', () => {
  const normalized = normalizeConsoleEntry({
    id: 'err-1',
    level: 'error',
    args: ['Cannot read property x of undefined at index.html:42:7'],
    ts: new Date('2026-03-29T10:23:08Z').getTime(),
  })

  assert.equal(normalized.location?.file, 'index.html')
  assert.equal(normalized.location?.line, 42)
  assert.equal(normalized.levelLabel, 'ERR')

  const model = buildConsoleModel({
    filter: 'error',
    entries: [
      { id: 'l1', level: 'log', args: ['游戏初始化完成'], ts: 1 },
      { id: 'w1', level: 'warn', args: ['Canvas 尺寸超出视口'], ts: 2 },
      normalized,
      {
        id: 'ai-1',
        level: 'ai',
        text: '检测到错误，建议在 checkCollision 中添加 null 检查',
        actionLabel: '一键修复',
        ts: 4,
      },
    ],
  })

  assert.equal(model.stats.total, 3)
  assert.equal(model.stats.warn, 1)
  assert.equal(model.stats.error, 1)
  assert.equal(model.filteredEntries.length, 2)
  assert.equal(model.filteredEntries[0].level, 'error')
  assert.equal(model.filteredEntries[1].level, 'ai')
})

test('renderRuntimeConsoleWindow renders controls, log rows, error jump affordance, ai suggestion shell, footer stats, and empty state', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderRuntimeConsoleWindow(root, buildConsoleModel())
  assert.match(root.textContent, /运行游戏后，控制台输出将在这里显示/u)
  assert.equal(root.querySelector('[data-action="clear-console"]') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('select[name="console-filter"]') instanceof dom.window.HTMLSelectElement, true)

  const model = buildConsoleModel({
    filter: 'all',
    entries: [
      { id: 'l1', level: 'log', args: ['游戏初始化完成'], ts: 1 },
      { id: 'w1', level: 'warn', args: ['Canvas 尺寸超出视口'], ts: 2 },
      { id: 'e1', level: 'error', args: ['Cannot read property x of undefined at index.html:42:7'], ts: 3 },
      {
        id: 'ai-1',
        level: 'ai',
        text: '检测到错误，建议修复：在 checkCollision 中添加 null 检查',
        actionLabel: '一键修复',
        ts: 4,
      },
    ],
  })

  renderRuntimeConsoleWindow(root, model)

  assert.match(root.textContent, /游戏初始化完成/u)
  assert.match(root.textContent, /Canvas 尺寸超出视口/u)
  assert.match(root.textContent, /Cannot read property/u)
  assert.match(root.textContent, /检测到错误，建议修复/u)
  assert.equal(root.querySelectorAll('.rw-console__row').length, 4)
  assert.equal(root.querySelector('.rw-console__row--warn') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.rw-console__row--error') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('.rw-console__row--ai') instanceof dom.window.HTMLElement, true)
  assert.equal(root.querySelector('[data-action="jump-to-error"]')?.textContent, '跳转')
  assert.equal(root.querySelector('[data-action="apply-ai-fix"]')?.textContent, '一键修复')
  assert.match(root.querySelector('.rw-console__footer')?.textContent || '', /4 条日志/u)
  assert.match(root.querySelector('.rw-console__footer')?.textContent || '', /1 警告/u)
  assert.match(root.querySelector('.rw-console__footer')?.textContent || '', /1 错误/u)
})
