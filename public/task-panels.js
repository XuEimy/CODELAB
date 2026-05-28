export const TASK_WORKFLOW_STEPS = [
  { id: 'understand', label: '理解需求' },
  { id: 'implement', label: '编写代码' },
  { id: 'preview', label: '预览测试' },
  { id: 'submit', label: '提交验收' },
]

const DEFAULT_TASK_CATEGORY = { label: '未分类任务', tone: 'gold' }

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatTaskCount(count) {
  return `已认领 ${count} 个任务`
}

function formatOnlineDuration(minutes = 0) {
  const safeMinutes = Math.max(0, Number(minutes) || 0)
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function normalizeCategory(category) {
  if (!category) return DEFAULT_TASK_CATEGORY
  if (typeof category === 'string') return { label: category, tone: 'gold' }
  return {
    label: category.label || DEFAULT_TASK_CATEGORY.label,
    tone: category.tone || 'gold',
  }
}

function normalizeWorkflowSteps(activeStep = 'understand') {
  const activeIndex = Math.max(
    0,
    TASK_WORKFLOW_STEPS.findIndex((step) => step.id === activeStep),
  )
  return TASK_WORKFLOW_STEPS.map((step, index) => ({
    ...step,
    state: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'todo',
  }))
}

function normalizeRelatedNodes(relatedNodes = []) {
  return relatedNodes.map((node, index) => ({
    id: node.id || `node-${index}`,
    label: node.label || node.title || `关联节点 ${index + 1}`,
    state: node.state || '待办',
    current: Boolean(node.current),
  }))
}

export function buildTaskCockpitModel({
  task,
  activeStep = 'understand',
  relatedNodes = [],
  submitLabel = '提交验收',
} = {}) {
  if (!task?.title) {
    return {
      empty: true,
      title: '',
      category: DEFAULT_TASK_CATEGORY,
      description: '',
      workflowSteps: normalizeWorkflowSteps('understand'),
      relatedNodes: [],
      submit: { label: submitLabel, disabled: true },
    }
  }

  return {
    empty: false,
    id: task.id || '',
    title: task.title,
    category: normalizeCategory(task.category),
    description: task.description || '',
    workflowSteps: normalizeWorkflowSteps(activeStep),
    relatedNodes: normalizeRelatedNodes(relatedNodes),
    submit: { label: submitLabel, disabled: false },
  }
}

function renderTaskCockpitMarkup(model) {
  if (model.empty) {
    return `
      <section class="task-cockpit task-cockpit--empty">
        <div class="task-cockpit__empty-title">选择一个任务节点开始</div>
        <div class="task-cockpit__empty-copy">任务标题、工作流进度和关联节点会在这里出现。</div>
        <div class="task-cockpit__steps task-cockpit__steps--skeleton">
          ${model.workflowSteps
            .map(
              (step) => `
                <div class="task-cockpit__step task-cockpit__step--${step.state}" data-step="${escapeHtml(step.id)}">
                  <span class="task-cockpit__dot"></span>
                  <span class="task-cockpit__step-label">${escapeHtml(step.label)}</span>
                </div>
              `,
            )
            .join('')}
        </div>
      </section>
    `
  }

  return `
    <section class="task-cockpit">
      <header class="task-cockpit__header">
        <h2 class="task-cockpit__title">${escapeHtml(model.title)}</h2>
        <div class="task-cockpit__badge task-cockpit__badge--${escapeHtml(model.category.tone)}">${escapeHtml(model.category.label)}</div>
      </header>
      <section class="task-cockpit__section">
        <div class="task-cockpit__section-title">工作流进度</div>
        <div class="task-cockpit__steps">
          ${model.workflowSteps
            .map(
              (step) => `
                <div class="task-cockpit__step task-cockpit__step--${step.state}" data-step="${escapeHtml(step.id)}">
                  <span class="task-cockpit__dot"></span>
                  <span class="task-cockpit__step-label">${escapeHtml(step.label)}</span>
                </div>
              `,
            )
            .join('')}
        </div>
      </section>
      <section class="task-cockpit__section">
        <div class="task-cockpit__section-title">任务描述</div>
        <div class="task-cockpit__description">${escapeHtml(model.description || '暂无任务描述')}</div>
      </section>
      <section class="task-cockpit__section">
        <div class="task-cockpit__section-title">关联节点</div>
        <div class="task-cockpit__nodes">
          ${model.relatedNodes
            .map(
              (node) => `
                <div class="task-cockpit__node${node.current ? ' task-cockpit__node--current' : ''}" data-node-id="${escapeHtml(node.id)}">
                  <span class="task-cockpit__node-label">${escapeHtml(node.label)}</span>
                  <span class="task-cockpit__node-state">${escapeHtml(node.state)}</span>
                </div>
              `,
            )
            .join('')}
        </div>
      </section>
      <button class="task-cockpit__submit" type="button"${model.submit.disabled ? ' disabled' : ''}>${escapeHtml(model.submit.label)}</button>
    </section>
  `
}

export function renderTaskCockpit(container, model = buildTaskCockpitModel()) {
  if (!container) return
  container.innerHTML = renderTaskCockpitMarkup(model)
}

function normalizeDashboardTasks(tasks = []) {
  return tasks.map((task, index) => ({
    id: task.id || `task-${index}`,
    title: task.title || `任务 ${index + 1}`,
    state: task.state || '待办',
    current: Boolean(task.current),
  }))
}

function normalizeContributionStats(contributionStats = {}) {
  return [
    { label: '代码', value: `${Number(contributionStats.codeLines) || 0} 行` },
    { label: 'AI 对话', value: `${Number(contributionStats.aiRequests) || 0} 次` },
    { label: '预览', value: `${Number(contributionStats.previews) || 0} 次` },
    { label: '在线', value: formatOnlineDuration(contributionStats.onlineMinutes) },
  ]
}

export function buildMyDashboardModel({
  user = {},
  tasks = [],
  contributionStats = {},
  notes = '',
} = {}) {
  const normalizedTasks = normalizeDashboardTasks(tasks)
  return {
    empty: normalizedTasks.length === 0,
    summary: {
      name: user.name || '协作者',
      avatar: user.avatar || '😊',
      online: user.online !== false,
      taskCount: normalizedTasks.length,
      taskLabel: formatTaskCount(normalizedTasks.length),
    },
    tasks: normalizedTasks,
    contributionStats: normalizeContributionStats(contributionStats),
    notes: {
      label: '个人笔记',
      value: notes || '',
      placeholder: '记录当前任务的关键决策...',
    },
  }
}

function renderEmptyDashboard(model) {
  return `
    <section class="my-dashboard my-dashboard--empty">
      <div class="my-dashboard__summary">
        <div class="my-dashboard__avatar">${escapeHtml(model.summary.avatar)}</div>
        <div class="my-dashboard__summary-copy">
          <div class="my-dashboard__name">${escapeHtml(model.summary.name)}</div>
          <div class="my-dashboard__status">● 在线</div>
        </div>
      </div>
      <div class="my-dashboard__empty-title">还没有认领任务</div>
      <div class="my-dashboard__empty-copy">前往智慧树认领第一个任务</div>
    </section>
  `
}

function renderMyDashboardMarkup(model) {
  if (model.empty) return renderEmptyDashboard(model)

  return `
    <section class="my-dashboard">
      <header class="my-dashboard__summary">
        <div class="my-dashboard__avatar">${escapeHtml(model.summary.avatar)}</div>
        <div class="my-dashboard__summary-copy">
          <div class="my-dashboard__name">${escapeHtml(model.summary.name)}</div>
          <div class="my-dashboard__meta">${escapeHtml(model.summary.taskLabel)}</div>
        </div>
      </header>
      <section class="my-dashboard__section">
        <div class="my-dashboard__section-title">我的任务</div>
        <div class="my-dashboard__tasks">
          ${model.tasks
            .map(
              (task) => `
                <div class="my-dashboard__task${task.current ? ' my-dashboard__task--current' : ''}" data-task-id="${escapeHtml(task.id)}">
                  <span class="my-dashboard__task-title">${escapeHtml(task.title)}</span>
                  <span class="my-dashboard__task-state">${escapeHtml(task.state)}${task.current ? ' ←当前' : ''}</span>
                </div>
              `,
            )
            .join('')}
        </div>
      </section>
      <section class="my-dashboard__section">
        <div class="my-dashboard__section-title">今日贡献</div>
        <div class="my-dashboard__stats">
          ${model.contributionStats
            .map((entry) => `${escapeHtml(entry.label)} ${escapeHtml(entry.value)}`)
            .join(' · ')}
        </div>
      </section>
      <section class="my-dashboard__section">
        <div class="my-dashboard__section-title">${escapeHtml(model.notes.label)}</div>
        <div class="my-dashboard__notes">${escapeHtml(model.notes.value || model.notes.placeholder)}</div>
      </section>
    </section>
  `
}

export function renderMyDashboard(container, model = buildMyDashboardModel()) {
  if (!container) return
  container.innerHTML = renderMyDashboardMarkup(model)
}
