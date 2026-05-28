import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'

const projectRoot = path.resolve(import.meta.dirname, '..')
const modulePath = path.join(projectRoot, 'public', 'design-workbench.js')

test('design studio windows render PRD-aligned graph, design agent, and design preview surfaces', async () => {
  const moduleUrl = pathToFileURL(modulePath).href
  const {
    createDesignStudioState,
    reduceDesignStudioState,
    renderDesignTreeWindow,
    renderDesignGraphWindow,
    renderVibeSkillsWindow,
    renderWebDesignWindow,
  } = await import(moduleUrl)

  let state = createDesignStudioState()
  state = reduceDesignStudioState(state, { type: 'set-schema', schemaId: 'snake' })
  state = reduceDesignStudioState(state, { type: 'select-node', nodeId: 'hero' })
  state = reduceDesignStudioState(state, {
    type: 'set-runtime',
    runtime: {
      graphMineNodeIds: ['hero', 'button'],
      graphNodeStates: {
        hero: 'in-progress',
        button: 'todo',
        boss: 'done',
      },
      graphSummary: {
        concept: '贪吃蛇游戏',
        consensus: ['基础玩法采用经典贪吃蛇', '首屏继续保留邀请函式启动感'],
        nextSteps: ['下一步：补上道具系统入口'],
        openQuestions: ['碰撞检测继续保持矩形还是切换成圆形判定？'],
        conflicts: ['双人模式的网络延迟方案还没有统一。'],
      },
    },
  })

  const dom = new JSDOM(`
    <div id="tree"></div>
    <div id="graph"></div>
    <div id="vibe"></div>
    <div id="web"></div>
  `)

  renderDesignTreeWindow(dom.window.document.getElementById('tree'), state)
  renderDesignGraphWindow(dom.window.document.getElementById('graph'), state)
  renderVibeSkillsWindow(dom.window.document.getElementById('vibe'), state)
  renderWebDesignWindow(dom.window.document.getElementById('web'), state)

  const text = dom.window.document.body.textContent || ''

  assert.match(text, /游戏概览/u)
  assert.match(text, /智慧树/u)
  assert.match(text, /我的任务/u)
  assert.match(text, /全局/u)
  assert.match(text, /AI 整理/u)
  assert.match(text, /共识摘要/u)
  assert.match(text, /待确认/u)
  assert.match(text, /潜在冲突/u)
  assert.match(text, /首屏像冒险邀请函/u)
  assert.match(text, /设计 Agent/u)
  assert.match(text, /设计卡片/u)
  assert.match(text, /配色/u)
  assert.match(text, /固定到智慧树/u)
  assert.match(text, /设计预览/u)
  assert.match(text, /Web 令牌/u)
  assert.match(text, /当前节点布局/u)
  assert.equal(dom.window.document.querySelectorAll('.studio-window__web-scroll').length, 1)
  assert.doesNotMatch(text, /Vibe Skills/u)
  assert.doesNotMatch(text, /Vibe Design Chat/u)
  assert.doesNotMatch(text, /Web Design/u)
  assert.equal(dom.window.document.querySelectorAll('[data-studio-node-id]').length >= 2, true)
  assert.equal(dom.window.document.querySelectorAll('[data-design-graph-view]').length, 2)
  assert.equal(dom.window.document.querySelectorAll('[data-design-graph-action=\"organize\"]').length, 1)
  assert.equal(dom.window.document.querySelectorAll('[data-design-agent-card]').length >= 2, true)
  assert.equal(dom.window.document.querySelectorAll('[data-design-agent-skill]').length >= 5, true)
  assert.equal(dom.window.document.querySelectorAll('[data-design-param-key]').length >= 1, true)
  assert.equal(dom.window.document.querySelectorAll('[data-web-field-key]').length >= 1, true)
  assert.equal(dom.window.document.querySelectorAll('[data-design-preview-tab]').length, 2)

  state = reduceDesignStudioState(state, { type: 'set-design-preview-tab', tab: 'preview' })
  state = reduceDesignStudioState(state, { type: 'set-design-preview-skin', skinId: 'arcade' })
  renderWebDesignWindow(dom.window.document.getElementById('web'), state)

  const webText = dom.window.document.getElementById('web')?.textContent || ''
  assert.match(webText, /设计预览/u)
  assert.match(webText, /预览外框/u)
  assert.equal(dom.window.document.querySelectorAll('[data-design-preview-skin]').length >= 4, true)
  assert.equal(dom.window.document.querySelector('[data-design-preview-surface=\"arcade\"]') instanceof dom.window.HTMLElement, true)
})
