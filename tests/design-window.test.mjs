import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const projectRoot = path.resolve(import.meta.dirname, '..')
const appPath = path.join(projectRoot, 'public', 'app.html')
const modulePath = path.join(projectRoot, 'public', 'design-workbench.js')

test('app wires the design window through the shared design workbench module', async () => {
  const html = fs.readFileSync(appPath, 'utf8')

  assert.equal(fs.existsSync(modulePath), true, 'design workbench module should exist')
  assert.match(html, /from '\/design-workbench\.js'/u)
  assert.match(html, /design-workbench-root/u)

  const moduleUrl = pathToFileURL(modulePath).href
  const {
    createDesignWorkbenchState,
    renderDesignWorkbench,
  } = await import(moduleUrl)

  const state = createDesignWorkbenchState()
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderDesignWorkbench(root, state)

  assert.equal(root.querySelector('.design-workbench') instanceof dom.window.HTMLElement, true)
  assert.match(root.textContent, /游戏结构树/u)
  assert.match(root.textContent, /智慧树/u)
  assert.match(root.textContent, /参数检查器/u)
  assert.match(root.textContent, /设计 Agent/u)
  assert.doesNotMatch(root.textContent, /结构图/u)
  assert.doesNotMatch(root.textContent, /Vibe 映射/u)
  assert.equal(root.querySelectorAll('[data-design-node-id]').length >= 6, true)
  assert.equal(root.querySelectorAll('[data-design-vibe-id]').length >= 3, true)
  assert.equal(root.querySelectorAll('[data-design-param-key]').length >= 6, true)
})

test('design studio state exposes graph view and design preview hooks for controller wiring', async () => {
  const moduleUrl = pathToFileURL(modulePath).href
  const {
    createDesignStudioState,
    reduceDesignStudioState,
  } = await import(moduleUrl)

  let state = createDesignStudioState()

  assert.equal(state.graphView, 'mine')
  assert.equal(state.designPreviewTab, 'tokens')
  assert.equal(state.designPreviewSkin, 'modern')

  state = reduceDesignStudioState(state, { type: 'set-graph-view', view: 'global' })
  state = reduceDesignStudioState(state, { type: 'set-design-preview-tab', tab: 'preview' })
  state = reduceDesignStudioState(state, { type: 'set-design-preview-skin', skinId: 'arcade' })

  assert.equal(state.graphView, 'global')
  assert.equal(state.designPreviewTab, 'preview')
  assert.equal(state.designPreviewSkin, 'arcade')
})

test('design workbench can turn structured adjustments into updated snake code', async () => {
  const moduleUrl = pathToFileURL(modulePath).href
  const {
    applyDesignStateToCode,
    createDesignWorkbenchState,
    reduceDesignWorkbenchState,
  } = await import(moduleUrl)

  const html = fs.readFileSync(appPath, 'utf8')
  const snakeCode = html.match(/const SNAKE_CODE=`([\s\S]*?)`\n<\/script>/)?.[1]
  assert.equal(typeof snakeCode, 'string')

  let state = createDesignWorkbenchState(snakeCode)
  state = reduceDesignWorkbenchState(state, { type: 'set-field', key: 'canvasWidth', value: 520 })
  state = reduceDesignWorkbenchState(state, { type: 'set-field', key: 'canvasHeight', value: 480 })
  state = reduceDesignWorkbenchState(state, { type: 'set-field', key: 'background', value: '#101820' })
  state = reduceDesignWorkbenchState(state, { type: 'set-field', key: 'foodColor', value: '#ff8844' })
  state = reduceDesignWorkbenchState(state, { type: 'set-field', key: 'baseSpeed', value: 120 })

  const updated = applyDesignStateToCode(snakeCode, state)

  assert.match(updated, /width="520"/u)
  assert.match(updated, /height="480"/u)
  assert.match(updated, /background:#101820/u)
  assert.match(updated, /ctx\.shadowColor='#ff8844'/u)
  assert.match(updated, /speed=120,running=false/u)
})
