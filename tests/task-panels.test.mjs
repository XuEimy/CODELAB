import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import {
  TASK_WORKFLOW_STEPS,
  buildMyDashboardModel,
  buildTaskCockpitModel,
  renderMyDashboard,
  renderTaskCockpit,
} from '../public/task-panels.js'

test('buildTaskCockpitModel creates PRD workflow steps and related nodes', () => {
  const model = buildTaskCockpitModel({
    task: {
      id: 'task-1',
      title: '碰撞检测优化',
      category: '系统 · 战斗机制',
      description: '优化贪吃蛇碰撞检测逻辑，修复边界穿透 bug。',
    },
    activeStep: 'implement',
    relatedNodes: [
      { id: 'node-1', label: '碰撞检测', state: '进行中', current: true },
      { id: 'node-2', label: '物理引擎', state: '已完成' },
      { id: 'node-3', label: '边界处理', state: '待办' },
    ],
  })

  assert.equal(TASK_WORKFLOW_STEPS.length, 4)
  assert.equal(model.title, '碰撞检测优化')
  assert.equal(model.category.label, '系统 · 战斗机制')
  assert.deepEqual(
    model.workflowSteps.map((step) => [step.id, step.state]),
    [
      ['understand', 'done'],
      ['implement', 'active'],
      ['preview', 'todo'],
      ['submit', 'todo'],
    ],
  )
  assert.equal(model.relatedNodes[0].current, true)
  assert.equal(model.submit.disabled, false)
})

test('renderTaskCockpit renders content and empty state', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderTaskCockpit(root, buildTaskCockpitModel())
  assert.match(root.innerHTML, /选择一个任务节点开始/u)
  assert.match(root.innerHTML, /task-cockpit--empty/u)

  renderTaskCockpit(
    root,
    buildTaskCockpitModel({
      task: {
        id: 'task-1',
        title: '碰撞检测优化',
        category: '系统 · 战斗机制',
        description: '优化贪吃蛇碰撞检测逻辑，修复边界穿透 bug。',
      },
      activeStep: 'preview',
      relatedNodes: [
        { id: 'node-1', label: '碰撞检测', state: '进行中', current: true },
        { id: 'node-2', label: '物理引擎', state: '已完成' },
      ],
    }),
  )

  assert.match(root.innerHTML, /碰撞检测优化/u)
  assert.match(root.innerHTML, /系统 · 战斗机制/u)
  assert.equal(root.querySelectorAll('.task-cockpit__step').length, 4)
  assert.equal(root.querySelector('.task-cockpit__step--active')?.getAttribute('data-step'), 'preview')
  assert.match(root.innerHTML, /关联节点/u)
  assert.match(root.innerHTML, /提交验收/u)
})

test('buildMyDashboardModel summarizes current tasks and contribution stats', () => {
  const model = buildMyDashboardModel({
    user: { id: 'u1', name: '玩家8309', avatar: '😊', online: true },
    tasks: [
      { id: 'task-1', title: '碰撞检测', state: '进行中', current: true },
      { id: 'task-2', title: 'UI 美化', state: '待办' },
      { id: 'task-3', title: '基础移动', state: '已完成' },
    ],
    contributionStats: {
      codeLines: 127,
      aiRequests: 8,
      previews: 5,
      onlineMinutes: 134,
    },
    notes: '记得补边界 case',
  })

  assert.equal(model.summary.name, '玩家8309')
  assert.equal(model.summary.taskCount, 3)
  assert.equal(model.tasks[0].current, true)
  assert.equal(model.contributionStats[0].value, '127 行')
  assert.equal(model.contributionStats[3].value, '2h 14m')
  assert.equal(model.notes.value, '记得补边界 case')
})

test('renderMyDashboard renders populated and empty states', () => {
  const dom = new JSDOM('<div id="root"></div>')
  const root = dom.window.document.getElementById('root')

  renderMyDashboard(root, buildMyDashboardModel())
  assert.match(root.innerHTML, /还没有认领任务/u)
  assert.match(root.innerHTML, /前往智慧树认领第一个任务/u)

  renderMyDashboard(
    root,
    buildMyDashboardModel({
      user: { name: '玩家8309', avatar: '😊', online: true },
      tasks: [
        { id: 'task-1', title: '碰撞检测', state: '进行中', current: true },
        { id: 'task-2', title: 'UI 美化', state: '待办' },
      ],
      contributionStats: {
        codeLines: 127,
        aiRequests: 8,
        previews: 5,
        onlineMinutes: 134,
      },
      notes: '记得补边界 case',
    }),
  )

  assert.match(root.innerHTML, /玩家8309/u)
  assert.match(root.innerHTML, /已认领 2 个任务/u)
  assert.equal(root.querySelector('.my-dashboard__task--current')?.getAttribute('data-task-id'), 'task-1')
  assert.match(root.innerHTML, /代码 127 行/u)
  assert.match(root.innerHTML, /个人笔记/u)
  assert.match(root.innerHTML, /记得补边界 case/u)
})
