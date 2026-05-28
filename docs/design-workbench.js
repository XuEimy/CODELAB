function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const PARAM_DEFS = [
  { key: 'canvasWidth', label: '画布宽度', unit: 'px', kind: 'range', min: 280, max: 720, step: 20, defaultValue: 400 },
  { key: 'canvasHeight', label: '画布高度', unit: 'px', kind: 'range', min: 280, max: 720, step: 20, defaultValue: 400 },
  { key: 'background', label: '背景底色', kind: 'color', defaultValue: '#050912' },
  { key: 'gridColor', label: '网格线颜色', kind: 'color-rgba', defaultValue: 'rgba(19,32,64,.5)' },
  { key: 'cellSize', label: '蛇身宽度', unit: 'px', kind: 'range', min: 14, max: 28, step: 2, defaultValue: 20 },
  { key: 'initialLength', label: '开局长度', unit: '节', kind: 'range', min: 3, max: 8, step: 1, defaultValue: 3 },
  { key: 'headColor', label: '头部颜色', kind: 'color', defaultValue: '#00e8ff' },
  { key: 'bodyColor', label: '身体颜色', kind: 'color', defaultValue: '#39ff88' },
  { key: 'foodColor', label: '食物颜色', kind: 'color', defaultValue: '#ff2c6d' },
  { key: 'foodGlow', label: '食物辉光', unit: 'px', kind: 'range', min: 0, max: 36, step: 2, defaultValue: 18 },
  { key: 'baseSpeed', label: '基础速度', unit: 'ms', kind: 'range', min: 80, max: 220, step: 5, defaultValue: 145 },
  { key: 'speedFloor', label: '最快节奏', unit: 'ms', kind: 'range', min: 35, max: 120, step: 5, defaultValue: 55 },
  { key: 'levelStep', label: '升级阈值', unit: '分', kind: 'range', min: 2, max: 10, step: 1, defaultValue: 5 },
  { key: 'headRadius', label: '头部圆角', unit: 'px', kind: 'range', min: 2, max: 10, step: 1, defaultValue: 5 },
  { key: 'bodyRadius', label: '身体圆角', unit: 'px', kind: 'range', min: 1, max: 8, step: 1, defaultValue: 3 },
  { key: 'canvasGlow', label: '边框辉光', unit: '%', kind: 'range', min: 0, max: 30, step: 1, defaultValue: 14 },
]

const PARAM_MAP = Object.fromEntries(PARAM_DEFS.map((field) => [field.key, field]))

const NODE_TREE = [
  {
    id: 'scene',
    label: '场景 Scene',
    note: '画布、底色、网格',
    children: [
      { id: 'scene.canvas', label: '背景 > 画布', note: '舞台尺寸与底色', fields: ['canvasWidth', 'canvasHeight', 'background'] },
      { id: 'scene.grid', label: '背景 > 网格', note: '棋盘线与空间密度', fields: ['gridColor', 'canvasGlow'] },
    ],
  },
  {
    id: 'actor',
    label: '自己 Actor',
    note: '蛇身、食物、主角观感',
    children: [
      { id: 'actor.snake', label: '自己 > 蛇身', note: '大小、长度、颜色', fields: ['cellSize', 'initialLength', 'headColor', 'bodyColor', 'headRadius', 'bodyRadius'] },
      { id: 'actor.food', label: '食物 > 果实', note: '颜色、发光、存在感', fields: ['foodColor', 'foodGlow'] },
    ],
  },
  {
    id: 'rules',
    label: '规则 Rules',
    note: '速度与成长节奏',
    children: [
      { id: 'rules.pacing', label: '规则 > 节奏', note: '初速度、加速、上限', fields: ['baseSpeed', 'speedFloor', 'levelStep'] },
    ],
  },
]

const NODE_MAP = {}

function registerNodes(nodes, parentId = '') {
  nodes.forEach((node) => {
    const enriched = {
      ...node,
      parentId,
      kind: node.children ? 'group' : 'leaf',
    }
    NODE_MAP[node.id] = enriched
    if (node.children) registerNodes(node.children, node.id)
  })
}

registerNodes(NODE_TREE)

const LEAF_NODE_IDS = Object.values(NODE_MAP)
  .filter((node) => node.kind === 'leaf')
  .map((node) => node.id)

const VIBE_PROFILES = [
  {
    id: 'night-arcade',
    label: '夜光街机',
    note: '更霓虹、更清晰，保留黑场与高对比。',
    tags: ['黑场', '霓虹', '清脆'],
    impacts: {
      background: '#050912',
      gridColor: 'rgba(19,32,64,.5)',
      headColor: '#00e8ff',
      bodyColor: '#39ff88',
      foodColor: '#ff2c6d',
      foodGlow: 18,
      canvasGlow: 14,
    },
  },
  {
    id: 'spring-play',
    label: '春日软萌',
    note: '更明亮、更柔和，适合轻松可爱的画面气质。',
    tags: ['明亮', '柔和', '轻松'],
    impacts: {
      background: '#f7f2e7',
      gridColor: 'rgba(180,183,196,.45)',
      headColor: '#57b0ff',
      bodyColor: '#ffb367',
      foodColor: '#ff7c95',
      headRadius: 8,
      bodyRadius: 6,
      canvasGlow: 8,
    },
  },
  {
    id: 'danger-bloom',
    label: '危险警报',
    note: '更爆炸、更危险，突出目标与速度压力。',
    tags: ['危险', '爆发', '压力'],
    impacts: {
      background: '#15060a',
      gridColor: 'rgba(84,20,24,.42)',
      foodColor: '#ff4b5c',
      foodGlow: 26,
      baseSpeed: 125,
      speedFloor: 45,
      levelStep: 4,
      canvasGlow: 18,
    },
  },
  {
    id: 'paper-proto',
    label: '纸面原型',
    note: '去掉重光效，保留结构清晰和参数可读性。',
    tags: ['原型', '克制', '可读'],
    impacts: {
      background: '#f3f0ea',
      gridColor: 'rgba(153,158,170,.35)',
      headColor: '#2f5f99',
      bodyColor: '#4a8b78',
      foodColor: '#c45c5c',
      foodGlow: 4,
      canvasGlow: 4,
    },
  },
]

function cloneValues(values) {
  return Object.fromEntries(Object.entries(values))
}

function clampNumber(value, field) {
  const num = Number(value)
  const fallback = field.defaultValue
  if (!Number.isFinite(num)) return fallback
  const stepped = Math.round(num / field.step) * field.step
  return Math.min(field.max, Math.max(field.min, stepped))
}

function normalizeHex(value, fallback) {
  const raw = String(value || '').trim()
  if (/^#[0-9a-f]{3}$/i.test(raw) || /^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase()
  return fallback
}

function normalizeRgba(value, fallback) {
  const raw = String(value || '').trim()
  if (/^rgba?\([^)]*\)$/i.test(raw)) return raw
  return fallback
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}`.toLowerCase()
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex, '#000000').slice(1)
  const full = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized
  const value = Number.parseInt(full, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function extractMatch(code, pattern, fallback, transform = (match) => match[1]) {
  const match = String(code || '').match(pattern)
  if (!match) return fallback
  return transform(match)
}

function countSnakeLength(code) {
  const literal = extractMatch(code, /snake=\[([^\]]+)\]/, '')
  if (!literal) return PARAM_MAP.initialLength.defaultValue
  const count = literal.match(/\{x:/g)?.length || 0
  return count || PARAM_MAP.initialLength.defaultValue
}

export function extractDesignValuesFromCode(code = '') {
  const source = String(code || '')
  const bodyColorRgb = extractMatch(source, /#sv\{color:(#[0-9a-fA-F]{3,8})/, PARAM_MAP.bodyColor.defaultValue)
  const headColorRgb = extractMatch(source, /#lv\{color:(#[0-9a-fA-F]{3,8})/, PARAM_MAP.headColor.defaultValue)
  const canvasGlow = extractMatch(
    source,
    /box-shadow:0 0 50px rgba\(\d+,\d+,\d+,([.\d]+)\)/,
    PARAM_MAP.canvasGlow.defaultValue / 100,
    (match) => Number(match[1]),
  )

  return {
    canvasWidth: extractMatch(source, /<canvas[^>]*width="(\d+)"/, PARAM_MAP.canvasWidth.defaultValue, (match) => Number(match[1])),
    canvasHeight: extractMatch(source, /<canvas[^>]*height="(\d+)"/, PARAM_MAP.canvasHeight.defaultValue, (match) => Number(match[1])),
    background: extractMatch(source, /body\{background:(#[0-9a-fA-F]{3,8})/, PARAM_MAP.background.defaultValue),
    gridColor: extractMatch(source, /ctx\.strokeStyle='([^']+)'/, PARAM_MAP.gridColor.defaultValue),
    cellSize: extractMatch(source, /SZ=(\d+)/, PARAM_MAP.cellSize.defaultValue, (match) => Number(match[1])),
    initialLength: countSnakeLength(source),
    headColor: headColorRgb,
    bodyColor: bodyColorRgb,
    foodColor: extractMatch(source, /ctx\.shadowColor='(#[0-9a-fA-F]{3,8})';ctx\.shadowBlur/, PARAM_MAP.foodColor.defaultValue),
    foodGlow: extractMatch(source, /ctx\.shadowBlur=(\d+);ctx\.fillStyle/, PARAM_MAP.foodGlow.defaultValue, (match) => Number(match[1])),
    baseSpeed: extractMatch(source, /speed=(\d+),running=false/, PARAM_MAP.baseSpeed.defaultValue, (match) => Number(match[1])),
    speedFloor: extractMatch(source, /Math\.max\((\d+),speed-10\)/, PARAM_MAP.speedFloor.defaultValue, (match) => Number(match[1])),
    levelStep: extractMatch(source, /score%(\d+)===0/, PARAM_MAP.levelStep.defaultValue, (match) => Number(match[1])),
    headRadius: extractMatch(source, /roundRect\(s\.x\*SZ\+2,s\.y\*SZ\+2,SZ-4,SZ-4,i===0\?(\d+):/, PARAM_MAP.headRadius.defaultValue, (match) => Number(match[1])),
    bodyRadius: extractMatch(source, /roundRect\(s\.x\*SZ\+2,s\.y\*SZ\+2,SZ-4,SZ-4,i===0\?\d+:(\d+)\)/, PARAM_MAP.bodyRadius.defaultValue, (match) => Number(match[1])),
    canvasGlow: Math.round(canvasGlow * 100),
  }
}

function getGroupChildren(nodeId) {
  const node = NODE_MAP[nodeId]
  if (!node) return []
  if (node.kind === 'leaf') return [node.id]
  return node.children.flatMap((child) => getGroupChildren(child.id))
}

function getBranchNodeId(nodeId) {
  const node = NODE_MAP[nodeId]
  if (!node) return 'scene'
  if (!node.parentId) return node.id
  return node.parentId
}

function getScopedLeafIds(state) {
  if (state.vibeScope === 'global') return LEAF_NODE_IDS
  if (state.vibeScope === 'branch') return getGroupChildren(getBranchNodeId(state.selectedNodeId))
  return getGroupChildren(state.selectedNodeId)
}

function getScopedFieldKeys(state) {
  const fieldSet = new Set()
  getScopedLeafIds(state).forEach((leafId) => {
    const node = NODE_MAP[leafId]
    ;(node?.fields || []).forEach((field) => fieldSet.add(field))
  })
  return Array.from(fieldSet)
}

function computeDirtyKeys(values, baselineValues) {
  return Object.keys(values).filter((key) => values[key] !== baselineValues[key])
}

function normalizeFieldValue(key, rawValue) {
  const field = PARAM_MAP[key]
  if (!field) return rawValue
  if (field.kind === 'range') return clampNumber(rawValue, field)
  if (field.kind === 'color') return normalizeHex(rawValue, field.defaultValue)
  if (field.kind === 'color-rgba') return normalizeRgba(rawValue, field.defaultValue)
  return rawValue
}

export function createDesignWorkbenchState(code = '') {
  const extracted = extractDesignValuesFromCode(code)
  const baseValues = PARAM_DEFS.reduce((acc, field) => {
    acc[field.key] = normalizeFieldValue(field.key, extracted[field.key] ?? field.defaultValue)
    return acc
  }, {})

  return {
    baseValues,
    values: cloneValues(baseValues),
    selectedNodeId: 'actor.snake',
    selectedVibeId: 'night-arcade',
    vibeScope: 'branch',
    dirtyKeys: [],
  }
}

export function reduceDesignWorkbenchState(state, action = {}) {
  if (!state) return createDesignWorkbenchState()

  if (action.type === 'select-node') {
    return { ...state, selectedNodeId: action.nodeId || state.selectedNodeId }
  }

  if (action.type === 'set-vibe-scope') {
    return { ...state, vibeScope: action.scope || state.vibeScope }
  }

  if (action.type === 'set-field') {
    const key = action.key
    if (!PARAM_MAP[key]) return state
    const values = cloneValues(state.values)
    values[key] = normalizeFieldValue(key, action.value)
    return {
      ...state,
      values,
      dirtyKeys: computeDirtyKeys(values, state.baseValues),
    }
  }

  if (action.type === 'apply-vibe') {
    const profile = VIBE_PROFILES.find((item) => item.id === action.vibeId)
    if (!profile) return state
    const allowedKeys = new Set(getScopedFieldKeys(state))
    const values = cloneValues(state.values)
    Object.entries(profile.impacts).forEach(([key, value]) => {
      if (allowedKeys.has(key)) values[key] = normalizeFieldValue(key, value)
    })
    return {
      ...state,
      selectedVibeId: profile.id,
      values,
      dirtyKeys: computeDirtyKeys(values, state.baseValues),
    }
  }

  if (action.type === 'reset-node') {
    const values = cloneValues(state.values)
    getScopedFieldKeys({ ...state, vibeScope: 'node' }).forEach((key) => {
      values[key] = state.baseValues[key]
    })
    return {
      ...state,
      values,
      dirtyKeys: computeDirtyKeys(values, state.baseValues),
    }
  }

  if (action.type === 'reset-all') {
    const values = cloneValues(state.baseValues)
    return {
      ...state,
      values,
      dirtyKeys: [],
    }
  }

  if (action.type === 'rebase') {
    return createDesignWorkbenchState(action.code || '')
  }

  return state
}

function getSelectedNode(state) {
  return NODE_MAP[state.selectedNodeId] || NODE_MAP['actor.snake']
}

function getInspectorFieldKeys(state) {
  return getScopedFieldKeys({ ...state, vibeScope: 'node' })
}

function getVibeProfile(state) {
  return VIBE_PROFILES.find((item) => item.id === state.selectedVibeId) || VIBE_PROFILES[0]
}

function renderTreeNode(node, state, depth = 0) {
  const active = state.selectedNodeId === node.id
  return `
    <div class="design-workbench__tree-node design-workbench__tree-node--depth-${depth}">
      <button class="design-workbench__tree-btn${active ? ' is-active' : ''}" data-design-node-id="${node.id}">
        <span class="design-workbench__tree-name">${escapeHtml(node.label)}</span>
        <span class="design-workbench__tree-note">${escapeHtml(node.note || '')}</span>
      </button>
      ${
        node.children
          ? `<div class="design-workbench__tree-children">${node.children.map((child) => renderTreeNode(child, state, depth + 1)).join('')}</div>`
          : ''
      }
    </div>
  `
}

function renderGraphGroup(group, state) {
  const activeGroup = state.selectedNodeId === group.id
  return `
    <div class="design-workbench__graph-group">
      <button class="design-workbench__graph-parent${activeGroup ? ' is-active' : ''}" data-design-node-id="${group.id}">
        ${escapeHtml(group.label)}
      </button>
      <div class="design-workbench__graph-children">
        ${group.children
          .map((child) => {
            const active = state.selectedNodeId === child.id
            return `
              <button class="design-workbench__graph-node${active ? ' is-active' : ''}" data-design-node-id="${child.id}">
                <span>${escapeHtml(child.label)}</span>
                <small>${escapeHtml(child.note || '')}</small>
              </button>
            `
          })
          .join('')}
      </div>
    </div>
  `
}

function renderFieldControl(state, key) {
  const field = PARAM_MAP[key]
  const value = state.values[key]
  if (!field) return ''

  if (field.kind === 'range') {
    return `
      <label class="design-workbench__field" data-design-param-key="${field.key}">
        <span class="design-workbench__field-head">
          <span class="design-workbench__field-label">${escapeHtml(field.label)}</span>
          <span class="design-workbench__field-value">${escapeHtml(value)}${field.unit ? ` ${escapeHtml(field.unit)}` : ''}</span>
        </span>
        <input
          class="design-workbench__range"
          type="range"
          min="${field.min}"
          max="${field.max}"
          step="${field.step}"
          value="${value}"
          data-design-param-key="${field.key}"
        >
      </label>
    `
  }

  if (field.kind === 'color') {
    return `
      <label class="design-workbench__field" data-design-param-key="${field.key}">
        <span class="design-workbench__field-head">
          <span class="design-workbench__field-label">${escapeHtml(field.label)}</span>
          <span class="design-workbench__field-value">${escapeHtml(value)}</span>
        </span>
        <span class="design-workbench__color-row">
          <input class="design-workbench__color" type="color" value="${escapeHtml(value)}" data-design-param-key="${field.key}">
          <input class="design-workbench__color-text" type="text" value="${escapeHtml(value)}" data-design-param-key="${field.key}">
        </span>
      </label>
    `
  }

  return `
    <label class="design-workbench__field" data-design-param-key="${field.key}">
      <span class="design-workbench__field-head">
        <span class="design-workbench__field-label">${escapeHtml(field.label)}</span>
        <span class="design-workbench__field-value">${escapeHtml(value)}</span>
      </span>
      <input class="design-workbench__text" type="text" value="${escapeHtml(value)}" data-design-param-key="${field.key}">
    </label>
  `
}

function renderScopeButton(state, scope, label) {
  return `
    <button class="design-workbench__scope-btn${state.vibeScope === scope ? ' is-active' : ''}" data-design-scope="${scope}">
      ${escapeHtml(label)}
    </button>
  `
}

function renderImpactList(state) {
  const profile = getVibeProfile(state)
  const scopedKeys = new Set(getScopedFieldKeys(state))
  const impacts = Object.entries(profile.impacts).filter(([key]) => scopedKeys.has(key))

  if (!impacts.length) {
    return '<div class="design-workbench__impact-empty">当前作用范围没有可被这个 vibe 推动的参数。</div>'
  }

  return `
    <ul class="design-workbench__impact-list">
      ${impacts
        .map(([key, value]) => `<li>${escapeHtml(PARAM_MAP[key]?.label || key)} <span>${escapeHtml(String(value))}</span></li>`)
        .join('')}
    </ul>
  `
}

export function renderDesignWorkbench(container, state) {
  if (!container) return

  const selectedNode = getSelectedNode(state)
  const fieldKeys = getInspectorFieldKeys(state)
  const vibe = getVibeProfile(state)

  container.innerHTML = `
    <div class="design-workbench">
      <div class="design-workbench__toolbar">
        <div class="design-workbench__summary">
          <span class="design-workbench__eyebrow">设计工作台</span>
          <strong>当前节点：${escapeHtml(selectedNode.label)}</strong>
          <span>已改 ${state.dirtyKeys.length} 项，可直接写回当前游戏代码。</span>
        </div>
        <div class="design-workbench__actions">
          <button class="design-workbench__action" data-design-action="reset-node">重置节点</button>
          <button class="design-workbench__action" data-design-action="reset-all">全部还原</button>
          <button class="design-workbench__action is-primary" data-design-action="apply">应用设计</button>
        </div>
      </div>

      <div class="design-workbench__grid">
        <section class="design-workbench__panel">
          <div class="design-workbench__panel-head">
            <span>游戏结构树</span>
            <small>先选对象，再精修参数</small>
          </div>
          <div class="design-workbench__panel-body design-workbench__panel-body--tree">
            ${NODE_TREE.map((group) => renderTreeNode(group, state)).join('')}
          </div>
        </section>

        <section class="design-workbench__panel">
          <div class="design-workbench__panel-head">
            <span>智慧树</span>
            <small>我的任务 / 全局 / AI 整理</small>
          </div>
          <div class="design-workbench__panel-body">
            <div class="design-workbench__graph-root">Snake Game</div>
            <div class="design-workbench__graph">
              ${NODE_TREE.map((group) => renderGraphGroup(group, state)).join('')}
            </div>
          </div>
        </section>

        <section class="design-workbench__panel">
          <div class="design-workbench__panel-head">
            <span>参数检查器</span>
            <small>${escapeHtml(selectedNode.note || '围绕当前对象做局部调整')}</small>
          </div>
          <div class="design-workbench__panel-body">
            <div class="design-workbench__inspector-meta">
              <span>${escapeHtml(selectedNode.label)}</span>
              <span>${fieldKeys.length} 项可调</span>
            </div>
            <div class="design-workbench__fields">
              ${fieldKeys.map((key) => renderFieldControl(state, key)).join('')}
            </div>
          </div>
        </section>

        <section class="design-workbench__panel">
          <div class="design-workbench__panel-head">
            <span>设计 Agent</span>
            <small>${escapeHtml(vibe.label)} · ${escapeHtml(vibe.note)}</small>
          </div>
          <div class="design-workbench__panel-body">
            <div class="design-workbench__scope-row">
              ${renderScopeButton(state, 'node', '作用到当前节点')}
              ${renderScopeButton(state, 'branch', '作用到子树')}
              ${renderScopeButton(state, 'global', '作用到全局')}
            </div>
            <div class="design-workbench__vibes">
              ${VIBE_PROFILES.map((profile) => {
                const active = profile.id === state.selectedVibeId
                return `
                  <button class="design-workbench__vibe${active ? ' is-active' : ''}" data-design-vibe-id="${profile.id}">
                    <strong>${escapeHtml(profile.label)}</strong>
                    <span>${escapeHtml(profile.note)}</span>
                    <small>${profile.tags.map((tag) => escapeHtml(tag)).join(' · ')}</small>
                  </button>
                `
              }).join('')}
            </div>
            <div class="design-workbench__impact">
              <div class="design-workbench__impact-head">设计卡片预览 · 已影响 ${Object.keys(vibe.impacts).filter((key) => getScopedFieldKeys(state).includes(key)).length} 个参数</div>
              ${renderImpactList(state)}
            </div>
          </div>
        </section>
      </div>
    </div>
  `
}

function buildSnakeLiteral(length) {
  const count = Math.max(3, Math.min(8, Number(length) || 3))
  return `[${Array.from({ length: count }, (_, index) => `{x:${10 - index},y:10}`).join(',')}]`
}

function replaceFirst(code, pattern, replacement) {
  return code.replace(pattern, replacement)
}

function replaceAll(code, pattern, replacement) {
  return code.replace(pattern, replacement)
}

export function applyDesignStateToCode(code, state) {
  const source = String(code || '')
  const values = state?.values || createDesignWorkbenchState().values
  const snakeLiteral = buildSnakeLiteral(values.initialLength)
  const headRgb = hexToRgb(values.headColor)
  const bodyRgb = hexToRgb(values.bodyColor)
  const canvasGlow = Math.max(0, Number(values.canvasGlow) || 0) / 100

  let next = source
  next = replaceFirst(next, /body\{background:#[0-9a-fA-F]{3,8}/, `body{background:${values.background}`)
  next = replaceFirst(next, /<canvas id="c" width="\d+" height="\d+"/, `<canvas id="c" width="${values.canvasWidth}" height="${values.canvasHeight}"`)
  next = replaceFirst(next, /ctx\.fillStyle='#[0-9a-fA-F]{3,8}';ctx\.fillRect\(0,0,cvs\.width,cvs\.height\)/, `ctx.fillStyle='${values.background}';ctx.fillRect(0,0,cvs.width,cvs.height)`)
  next = replaceFirst(next, /ctx\.strokeStyle='[^']+'/, `ctx.strokeStyle='${values.gridColor}'`)
  next = replaceFirst(next, /SZ=\d+/, `SZ=${values.cellSize}`)
  next = replaceAll(next, /\[\{x:10,y:10\},\{x:9,y:10\},\{x:8,y:10\}(?:,\{x:\d+,y:10\})*\]/g, snakeLiteral)
  next = replaceFirst(next, /speed=\d+,running=false/, `speed=${values.baseSpeed},running=false`)
  next = replaceFirst(next, /score%\d+===0/, `score%${values.levelStep}===0`)
  next = replaceFirst(next, /Math\.max\(\d+,speed-10\)/, `Math.max(${values.speedFloor},speed-10)`)
  next = replaceFirst(next, /ctx\.shadowColor='#[0-9a-fA-F]{3,8}';ctx\.shadowBlur=\d+;ctx\.fillStyle='#[0-9a-fA-F]{3,8}'/, `ctx.shadowColor='${values.foodColor}';ctx.shadowBlur=${values.foodGlow};ctx.fillStyle='${values.foodColor}'`)
  next = replaceFirst(
    next,
    /ctx\.fillStyle=i===0\?'rgba\(\d+,\d+,\d+,'\+a\+'\)':'rgba\(\d+,\d+,\d+,'\+a\+'\)'/,
    `ctx.fillStyle=i===0?'rgba(${headRgb.r},${headRgb.g},${headRgb.b},'+a+')':'rgba(${bodyRgb.r},${bodyRgb.g},${bodyRgb.b},'+a+')'`,
  )
  next = replaceFirst(next, /ctx\.shadowColor=i===0\?'#[0-9a-fA-F]{3,8}':'transparent'/, `ctx.shadowColor=i===0?'${values.headColor}':'transparent'`)
  next = replaceFirst(next, /ctx\.shadowBlur=i===0\?\d+:0/, `ctx.shadowBlur=i===0?16:0`)
  next = replaceFirst(next, /ctx\.roundRect\(s\.x\*SZ\+2,s\.y\*SZ\+2,SZ-4,SZ-4,i===0\?\d+:\d+\)/, `ctx.roundRect(s.x*SZ+2,s.y*SZ+2,SZ-4,SZ-4,i===0?${values.headRadius}:${values.bodyRadius})`)
  next = replaceFirst(next, /#sv\{color:#[0-9a-fA-F]{3,8};text-shadow:0 0 12px rgba\(\d+,\d+,\d+,[.\d]+\)\}/, `#sv{color:${values.bodyColor};text-shadow:0 0 12px rgba(${bodyRgb.r},${bodyRgb.g},${bodyRgb.b},.7)}`)
  next = replaceFirst(next, /#lv\{color:#[0-9a-fA-F]{3,8}\}/, `#lv{color:${values.headColor}}`)
  next = replaceFirst(next, /canvas\{border:1px solid #[0-9a-fA-F]{3,8};box-shadow:0 0 50px rgba\(\d+,\d+,\d+,[.\d]+\)\}/, `canvas{border:1px solid #132040;box-shadow:0 0 50px rgba(${headRgb.r},${headRgb.g},${headRgb.b},${canvasGlow.toFixed(2)})}`)
  return next
}

const WEB_FIELD_DEFS = [
  { key: 'pageBg', label: '页面底色', kind: 'color', defaultValue: '#050912' },
  { key: 'pageTextColor', label: '正文颜色', kind: 'color', defaultValue: '#c0d4f0' },
  { key: 'panelBorderColor', label: '画布边框', kind: 'color', defaultValue: '#132040' },
  { key: 'hintColor', label: '提示文字', kind: 'color', defaultValue: '#4a6890' },
  { key: 'hudGap', label: 'HUD 间距', kind: 'range', unit: 'px', min: 12, max: 48, step: 2, defaultValue: 28 },
  { key: 'hudMargin', label: 'HUD 下边距', kind: 'range', unit: 'px', min: 8, max: 32, step: 2, defaultValue: 14 },
  { key: 'statSize', label: '数字字号', kind: 'range', unit: 'px', min: 14, max: 32, step: 1, defaultValue: 20 },
  { key: 'hintSize', label: '提示字号', kind: 'range', unit: 'px', min: 10, max: 18, step: 1, defaultValue: 11 },
  { key: 'canvasRadius', label: '画布圆角', kind: 'range', unit: 'px', min: 0, max: 24, step: 2, defaultValue: 0 },
  { key: 'shadowStrength', label: '阴影强度', kind: 'range', unit: '%', min: 0, max: 30, step: 1, defaultValue: 14 },
]

const WEB_FIELD_MAP = Object.fromEntries(WEB_FIELD_DEFS.map((field) => [field.key, field]))

const WEB_PRESETS = [
  {
    id: 'console',
    label: '控制台',
    note: '保留黑场和冷色对比，信息密度更强。',
    impacts: {
      pageBg: '#050912',
      pageTextColor: '#c0d4f0',
      panelBorderColor: '#132040',
      hintColor: '#4a6890',
      hudGap: 28,
      hudMargin: 14,
      statSize: 20,
      hintSize: 11,
      canvasRadius: 0,
      shadowStrength: 14,
    },
  },
  {
    id: 'product',
    label: '产品展示',
    note: '更亮、更圆、更像网页产品页。',
    impacts: {
      pageBg: '#f6f0e8',
      pageTextColor: '#1f2937',
      panelBorderColor: '#d2c4b4',
      hintColor: '#7a5c44',
      hudGap: 24,
      hudMargin: 18,
      statSize: 22,
      hintSize: 12,
      canvasRadius: 16,
      shadowStrength: 10,
    },
  },
  {
    id: 'soft-card',
    label: '柔和卡片',
    note: '更轻、更软，适合网页端协作展示。',
    impacts: {
      pageBg: '#f8f8fb',
      pageTextColor: '#243041',
      panelBorderColor: '#d8deea',
      hintColor: '#7b8698',
      hudGap: 22,
      hudMargin: 16,
      statSize: 21,
      hintSize: 12,
      canvasRadius: 18,
      shadowStrength: 8,
    },
  },
]

const TEMPLATE_SCHEMAS = {
  plants: {
    id: 'plants',
    label: '植物防守',
    badge: 'Preset Schema',
    graphRoot: 'Plants Defense',
    tree: [
      {
        id: 'plants.scene',
        label: '场景 > 草坪',
        note: '地块、天气、行列',
        children: [{ id: 'plants.scene.lawn', label: '场景 > 草坪', note: '地块配色 / 行列 / 日夜' }],
      },
      {
        id: 'plants.cherry',
        label: '植物 > 樱桃炸弹',
        note: '攻击范围、能量、杀伤力',
        children: [
          { id: 'plants.cherry.core', label: '植物 > 樱桃炸弹', note: '攻击范围 / 所需能量 / 杀伤力' },
          { id: 'plants.cherry.fx', label: '植物 > 爆炸表现', note: '烟雾 / 色温 / 震动' },
        ],
      },
      {
        id: 'plants.enemy',
        label: '敌人 > 僵尸',
        note: '血量、速度、硬直',
        children: [{ id: 'plants.enemy.core', label: '敌人 > 僵尸', note: '血量 / 移速 / 被击硬直' }],
      },
    ],
    graphColumns: [
      [{ id: 'plants.scene.lawn', label: '场景 > 草坪', note: '行列 / 日夜 / 地块' }],
      [
        { id: 'plants.cherry.core', label: '植物 > 樱桃炸弹', note: '攻击范围 / 所需能量 / 杀伤力' },
        { id: 'plants.cherry.fx', label: '植物 > 爆炸表现', note: '烟雾 / 色温 / 震动' },
      ],
      [{ id: 'plants.enemy.core', label: '敌人 > 僵尸', note: '血量 / 移速 / 硬直' }],
    ],
    inspector: {
      'plants.scene.lawn': {
        title: '场景 > 草坪',
        copy: '地块节奏决定阅读速度，所以它应该和战斗对象分开调。',
        fields: [
          { label: '地图列数', fill: '64%', value: '9 列' },
          { label: '地块对比', fill: '40%', value: '中' },
          { label: '日夜切换', fill: '28%', value: '弱' },
        ],
        schema: ['scene.lawn.columns', 'scene.lawn.contrast', 'scene.lawn.dayNight'],
      },
      'plants.cherry.core': {
        title: '植物 > 樱桃炸弹',
        copy: '能力对象的核心参数应该直接落在检查器，而不是埋在一堆总表里。',
        fields: [
          { label: '攻击范围', fill: '58%', value: '3 格' },
          { label: '所需能量', fill: '34%', value: '25' },
          { label: '杀伤力', fill: '84%', value: '120' },
        ],
        schema: ['ability.cherryBomb.range', 'ability.cherryBomb.cost', 'ability.cherryBomb.damage'],
      },
      'plants.cherry.fx': {
        title: '植物 > 爆炸表现',
        copy: '表现参数单独拆节点，设计师才知道自己调的是爆炸语言，不是数值平衡。',
        fields: [
          { label: '爆炸色温', fill: '74%', value: '暖' },
          { label: '烟雾厚度', fill: '46%', value: '中' },
          { label: '屏幕震动', fill: '36%', value: '弱中' },
        ],
        schema: ['feedback.cherryBomb.temp', 'feedback.cherryBomb.smoke', 'feedback.cherryBomb.shake'],
      },
      'plants.enemy.core': {
        title: '敌人 > 僵尸',
        copy: '敌人的压迫感和植物强度需要对照观察，所以也应该在树上直接看见。',
        fields: [
          { label: '血量', fill: '52%', value: '中' },
          { label: '移速', fill: '34%', value: '慢' },
          { label: '硬直', fill: '24%', value: '短' },
        ],
        schema: ['actor.zombie.hp', 'actor.zombie.speed', 'actor.zombie.hitstun'],
      },
    },
    skills: [
      { id: 'plants-bloom-warning', label: '爆炸预警', note: '强化樱桃炸弹的预警、色温和伤害暗示。', tags: ['当前节点', '攻击范围', '预警'] },
      { id: 'plants-garden-morning', label: '花园清晨', note: '把草坪与植物整体拉向更柔和的晨光质感。', tags: ['子树', '亮度', '柔和'] },
      { id: 'plants-metal-defense', label: '机械防守', note: '让敌人和技能反馈更硬、更冷、更规则。', tags: ['全局', '冷色', '硬边'] },
    ],
  },
  platformer: {
    id: 'platformer',
    label: '平台跳跃',
    badge: 'Preset Schema',
    graphRoot: 'Platformer',
    tree: [
      {
        id: 'platformer.player',
        label: '角色 > 主角',
        note: '跑动、跳跃、空中控制',
        children: [
          { id: 'platformer.player.move', label: '角色 > 跑动', note: '速度 / 惯性 / 刹车' },
          { id: 'platformer.player.jump', label: '角色 > 跳跃', note: '高度 / 二段跳 / 空中控制' },
        ],
      },
      {
        id: 'platformer.scene',
        label: '场景 > 关卡',
        note: '地块、镜头、危险区',
        children: [
          { id: 'platformer.scene.level', label: '场景 > 地块', note: '平台间距 / 危险区 / 检查点' },
          { id: 'platformer.scene.camera', label: '场景 > 镜头', note: '跟随 / 缓动 / 抖动' },
        ],
      },
      {
        id: 'platformer.fx',
        label: '表现 > 动效',
        note: '拖尾、命中、落地反馈',
        children: [{ id: 'platformer.fx.motion', label: '表现 > 动效', note: '拖尾 / 落地 / 命中停顿' }],
      },
    ],
    graphColumns: [
      [
        { id: 'platformer.player.move', label: '角色 > 跑动', note: '速度 / 惯性 / 刹车' },
        { id: 'platformer.player.jump', label: '角色 > 跳跃', note: '高度 / 二段跳 / 空中控制' },
      ],
      [
        { id: 'platformer.scene.level', label: '场景 > 地块', note: '平台间距 / 危险区' },
        { id: 'platformer.scene.camera', label: '场景 > 镜头', note: '跟随 / 缓动 / 抖动' },
      ],
      [{ id: 'platformer.fx.motion', label: '表现 > 动效', note: '拖尾 / 落地 / 命中停顿' }],
    ],
    inspector: {
      'platformer.player.move': {
        title: '角色 > 跑动',
        copy: '平台游戏的手感起点往往是跑动，而不是跳跃本身。',
        fields: [
          { label: '跑动速度', fill: '62%', value: '7.2' },
          { label: '启动惯性', fill: '38%', value: '中' },
          { label: '刹车力度', fill: '32%', value: '偏软' },
        ],
        schema: ['actor.player.runSpeed', 'actor.player.accel', 'actor.player.brake'],
      },
      'platformer.player.jump': {
        title: '角色 > 跳跃',
        copy: '跳跃是平台跳跃的主语，所以应该有单独节点和独立检查器。',
        fields: [
          { label: '跳跃高度', fill: '54%', value: '标准' },
          { label: '二段跳', fill: '68%', value: '开启' },
          { label: '空中控制', fill: '48%', value: '中' },
        ],
        schema: ['actor.player.jumpHeight', 'actor.player.doubleJump', 'actor.player.airControl'],
      },
      'platformer.scene.level': {
        title: '场景 > 地块',
        copy: '平台间距和危险区密度会决定玩家理解节奏的速度。',
        fields: [
          { label: '平台间距', fill: '58%', value: '中偏宽' },
          { label: '危险区密度', fill: '26%', value: '低' },
          { label: '检查点频率', fill: '42%', value: '常规' },
        ],
        schema: ['scene.level.gap', 'scene.level.hazard', 'scene.level.checkpoints'],
      },
      'platformer.scene.camera': {
        title: '场景 > 镜头',
        copy: '镜头是舒适度核心系统，必须从对象树里直观看到。',
        fields: [
          { label: '跟随延迟', fill: '30%', value: '轻' },
          { label: '镜头缓动', fill: '44%', value: '中' },
          { label: '冲刺抖动', fill: '22%', value: '弱' },
        ],
        schema: ['scene.camera.followLag', 'scene.camera.ease', 'scene.camera.shake'],
      },
      'platformer.fx.motion': {
        title: '表现 > 动效',
        copy: '动作反馈别混到物理里，独立拆开才好调。',
        fields: [
          { label: '拖尾长度', fill: '34%', value: '短' },
          { label: '落地尘土', fill: '30%', value: '轻' },
          { label: '命中停顿', fill: '24%', value: '轻' },
        ],
        schema: ['feedback.motion.trail', 'feedback.motion.land', 'feedback.motion.pause'],
      },
    },
    skills: [
      { id: 'platformer-airy-bounce', label: '轻盈弹跳', note: '把跳跃、镜头和动效一起推向更轻更弹。', tags: ['子树', '跳跃', '轻盈'] },
      { id: 'platformer-heavy-ruins', label: '沉重遗迹', note: '让跑动、刹车和镜头更沉，适合探索类关卡。', tags: ['全局', '沉重', '硬边'] },
      { id: 'platformer-speed-chase', label: '极速追逐', note: '强化冲刺、镜头跟随和危险提示。', tags: ['当前节点', '速度', '警示'] },
    ],
  },
}

const WEB_UI_TREE = [
  {
    id: 'web.page',
    label: '页面 > 画布',
    note: '网页底色、边框、正文色',
    children: [{ id: 'web.page.surface', label: '页面 > 画布', note: '页面底色 / 正文颜色 / 模块边框' }],
  },
  {
    id: 'web.layout',
    label: '布局 > 信息密度',
    note: '模块间距、HUD 节奏、字号',
    children: [{ id: 'web.layout.spacing', label: '布局 > 信息密度', note: 'HUD 间距 / 下边距 / 数字字号' }],
  },
  {
    id: 'web.motion',
    label: '表现 > 细节反馈',
    note: '提示语气、圆角、阴影',
    children: [{ id: 'web.motion.shell', label: '表现 > 细节反馈', note: '提示颜色 / 圆角 / 阴影' }],
  },
]

const WEB_NODE_FIELDS = {
  'web.page.surface': ['pageBg', 'pageTextColor', 'panelBorderColor'],
  'web.layout.spacing': ['hudGap', 'hudMargin', 'statSize', 'hintSize'],
  'web.motion.shell': ['hintColor', 'canvasRadius', 'shadowStrength'],
}

const WEB_UI_SKILLS = [
  { id: 'web-editorial', label: '编辑部感', note: '更留白、更克制、更像带版心的网页内容页。', tags: ['全局', '留白', '克制'] },
  { id: 'web-console', label: '控制台感', note: '更像开发工具，信息密度更高，对比更强。', tags: ['全局', '信息密度', '高对比'] },
  { id: 'web-product', label: '产品展示', note: '更圆、更亮、更像落地页或功能介绍页。', tags: ['子树', '圆角', '柔和'] },
]

const DESIGN_AGENT_SKILL_BUTTONS = [
  { id: 'palette', label: '配色' },
  { id: 'layout', label: '布局' },
  { id: 'motion', label: '动效' },
  { id: 'type', label: '字体' },
  { id: 'vibe', label: 'Vibe' },
]

const DESIGN_STYLE_REFS = [
  { id: 'cyberpunk', label: '赛博朋克', note: '霓虹灯光、暗色调、高科技低生活', accent: '#00e8ff' },
  { id: 'pixel-retro', label: '像素复古', note: '8-bit 风格、低分辨率、怀旧色彩', accent: '#39ff88' },
  { id: 'soft-cartoon', label: '柔和卡通', note: '圆润线条、柔和配色、可爱氛围', accent: '#ffb367' },
  { id: 'dark-realism', label: '暗黑写实', note: '高对比、写实材质、沉重氛围', accent: '#ff2c6d' },
  { id: 'nature-fresh', label: '清新自然', note: '绿色系、自然光、户外氛围', accent: '#4ade80' },
  { id: 'minimal-flat', label: '极简扁平', note: '纯色块、无阴影、信息清晰', accent: '#a78bfa' },
]

const DESIGN_COLOR_PALETTES = [
  { id: 'neon-night', label: '霓虹夜色', colors: ['#0a0a2e', '#00e8ff', '#ff2c6d', '#39ff88', '#a78bfa'] },
  { id: 'forest-dawn', label: '森林晨光', colors: ['#1a2e1a', '#4ade80', '#fbbf24', '#86efac', '#f0fdf4'] },
  { id: 'desert-dusk', label: '沙漠黄昏', colors: ['#2d1b00', '#f59e0b', '#ef4444', '#fcd34d', '#fef3c7'] },
  { id: 'deep-sea', label: '深海秘境', colors: ['#0c1222', '#0ea5e9', '#06b6d4', '#164e63', '#cffafe'] },
  { id: 'sakura-soft', label: '樱花柔粉', colors: ['#fdf2f8', '#f9a8d4', '#ec4899', '#be185d', '#831843'] },
]

const DESIGN_CHAR_REFS = [
  { id: 'chibi', label: 'Q版萌系', note: '大头小身、圆润五官、可爱表情', keywords: ['大头身', '圆润', '表情丰富'] },
  { id: 'realistic', label: '写实风格', note: '人体比例、肌肉纹理、光影细节', keywords: ['写实比例', '光影', '细节'] },
  { id: 'mecha', label: '机甲科幻', note: '金属质感、发光线条、硬边轮廓', keywords: ['金属', '发光', '硬边'] },
  { id: 'pixel-char', label: '像素方块', note: '低像素、简洁轮廓、有限色数', keywords: ['低像素', '限色', '简洁'] },
]

const DESIGN_INSPIRATION_SITES = [
  { id: 'dribbble', label: 'Dribbble', url: 'https://dribbble.com/search/game-ui', note: 'UI 与游戏视觉设计' },
  { id: 'artstation', label: 'ArtStation', url: 'https://www.artstation.com/search?sort_by=relevance&query=game+concept', note: '角色与场景概念设计' },
  { id: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com/search/pins/?q=game+visual+design', note: '情绪板与参考图收集' },
  { id: 'itch', label: 'Itch.io', url: 'https://itch.io/games/top-rated', note: '独立游戏视觉风格参考' },
  { id: 'coolors', label: 'Coolors', url: 'https://coolors.co/generate', note: '在线配色方案生成器' },
  { id: 'lospec', label: 'Lospec', url: 'https://lospec.com/palette-list', note: '像素艺术专用调色板' },
]

const DESIGN_AI_PROMPTS = [
  { id: 'char-gen', label: '生成角色概念', prompt: '请根据当前游戏风格，为我的游戏主角生成 3 个不同的视觉概念方向，包括配色、轮廓风格和情绪关键词。' },
  { id: 'scene-color', label: '生成场景配色', prompt: '请为当前游戏场景生成一套完整的配色方案，包括主色、辅色、强调色和背景色，并说明情绪和使用场景。' },
  { id: 'ui-style', label: '生成 UI 方案', prompt: '请根据游戏风格生成 3 个 UI 设计方向，包括按钮样式、面板风格、字体建议和整体布局思路。' },
  { id: 'vibe-board', label: '生成情绪板', prompt: '请为当前游戏生成一个文字版情绪板，描述视觉风格、色彩倾向、材质语言和情绪关键词。' },
]

const DESIGN_PREVIEW_SKINS = [
  { id: 'modern', label: '现代', note: '偏产品页的轻量展示外框。' },
  { id: 'retro', label: '复古', note: '更接近街机海报和像素机壳。' },
  { id: 'arcade', label: '街机', note: '突出高对比和强包裹感的展示壳。' },
  { id: 'handheld', label: '掌机', note: '紧凑、便携，适合小画幅预览。' },
]

const DESIGN_GRAPH_STATUS = {
  todo: '待办',
  'in-progress': '进行中',
  done: '已完成',
}

export const DESIGN_STUDIO_SCHEMA_IDS = ['snake', 'plants', 'platformer', 'web-ui', 'none']

const SNAKE_VISUAL_NODES = [
  { id: 'hero', eyebrow: 'Web Layer', label: 'Hero 区', note: '首屏视觉、标题情绪、CTA 节奏', className: 'hero' },
  { id: 'loop', eyebrow: 'Core Loop', label: '主玩法节奏', note: '成长、挑战、奖励循环', className: 'loop' },
  { id: 'world', eyebrow: 'World Tone', label: '世界氛围', note: '色调、场景、音色、危险底色', className: 'world' },
  { id: 'button', eyebrow: 'Entry', label: '开始按钮', note: '点击反馈、发光重量、启动感', className: 'button' },
  { id: 'nav', eyebrow: 'Flow', label: '导航动线', note: '页面切换、停留点、理解路径', className: 'nav' },
  { id: 'boss', eyebrow: 'Challenge', label: 'Boss 战节奏', note: '预警、强化、转阶段、高潮', className: 'boss' },
  { id: 'reward', eyebrow: 'Reward', label: '奖励结算页', note: '战利品展开、升级反馈、情绪释放', className: 'reward' },
  { id: 'shop', eyebrow: 'Economy', label: '商店循环', note: '购买反馈、稀有度、重抽节奏', className: 'shop' },
  { id: 'sound', eyebrow: 'Feedback', label: '音效层', note: '命中、提示、危险、胜利音', className: 'sound' },
]

const SNAKE_VISUAL_NODE_MAP = Object.fromEntries(SNAKE_VISUAL_NODES.map((node) => [node.id, node]))

const SNAKE_VISUAL_BOARD = {
  hero: [
    { title: '首屏像冒险邀请函', note: '不要像工具后台。视觉中心应该是“点进去就要开始冒险”的感觉。', tags: ['大标题', '邀请函', '轻工具感'] },
    { title: 'CTA 像启动旅程', note: '按钮不是普通提交按钮，而是一个让人愿意点下去的启程动作。', tags: ['启动感', '发光克制', '停留 1 秒'] },
    { title: '背景别太吵', note: '保留层次和氛围，但不能抢走首屏文案和操作路径。', tags: ['低噪背景', '层次清楚'] },
  ],
  loop: [
    { title: '主循环先稳再变', note: '前段让玩家建立规律，中段再引入更明显的压力和稀有奖励。', tags: ['先稳后变', '成长循环'] },
    { title: '奖励节点别太远', note: '如果连续反馈过长，热度会掉，尤其是轻玩法游戏。', tags: ['奖励密度', '停留时长'] },
  ],
  world: [
    { title: '轻松里带一点未知危险', note: '不是纯可爱，也不是直接阴暗，要让玩家觉得“安全但不完全安全”。', tags: ['轻松外壳', '未知底色'] },
    { title: '危险不要靠大红色', note: '更多用音色、留白和材质变化去铺危险。', tags: ['低饱和危险', '材质切换'] },
  ],
  button: [
    { title: '按钮像个出发开关', note: '不是普通提交按钮，要像启动旅程前按下去的那一下。', tags: ['启动感', '轻重量'] },
  ],
  nav: [
    { title: '路径得像被引导', note: '用户不该靠猜来理解下一步要去哪。', tags: ['停留点', '引导顺序'] },
  ],
  boss: [
    { title: '先让人察觉，再让人害怕', note: 'Boss 压力不该一上来就满格，预警比爆发更重要。', tags: ['预警', '转阶段', '压迫感'] },
    { title: '危险要有层次', note: '先是音色、再是视觉、最后才是伤害和空间压力。', tags: ['层层加压', '分段强化'] },
    { title: '高潮后给释放', note: 'Boss 段末端一定要有明显释放，否则只剩疲惫。', tags: ['释放感', '收束'] },
  ],
  reward: [
    { title: '结算不该像普通弹窗', note: '它应该是一次“战利品展开”，而不是一个机械确认框。', tags: ['展开动画', '收获感'] },
  ],
  shop: [
    { title: '买东西也得像推进旅程', note: '商店不是抽奖页，要让每次购买像在为下一段冒险做准备。', tags: ['旅程补给', '稀有度'] },
  ],
  sound: [
    { title: '危险来自声音组织', note: '不是所有危险都要靠红光，很多时候靠声音就够了。', tags: ['高频提示', '低频压迫'] },
  ],
}

const SNAKE_VISUAL_CHAT = {
  hero: {
    userTitle: '当前节点：Hero 区',
    userText: '我希望首页更像一张冒险邀请函，不是个普通工具站。',
    aiText: '先别急着调所有参数。建议先定三件事：标题像不像邀请、按钮像不像启程、背景会不会抢戏。我建议先把标题重量和 CTA 入场节奏拉出来看。',
    composer: '输入示例：把 Hero 区做得更像“轻松但可信”的产品首页，并给我 3 个网页版式方向。',
    suggestions: [
      { title: '推荐 1：标题像海报', text: '标题再更大，副标题更短，首屏先把“加入感”打满。', vibeId: 'spring-play' },
      { title: '推荐 2：CTA 先轻后猛', text: '默认状态克制，hover 才明显发亮，像“准备出发”的开关。', vibeId: 'paper-proto' },
      { title: '推荐 3：挂到画布', text: '把 Hero 方向拆成三张卡：标题、按钮、背景，各自去精修。', vibeId: 'night-arcade' },
    ],
  },
  loop: {
    userTitle: '当前节点：主玩法节奏',
    userText: '我想让主循环更上头，但又不要一上来就太压迫。',
    aiText: '建议先看“压力爬升”和“奖励回收”两条线。你可以先把生成节奏和奖励间隔拆开调，而不是把所有数值一起推高。',
    composer: '输入示例：帮我把主玩法改成“前轻后紧再释放”的节奏，并告诉我优先调哪 3 个点。',
    suggestions: [
      { title: '推荐 1：前 30 秒更稳', text: '先给玩家可预测回报，再渐渐增加异动。', vibeId: 'paper-proto' },
      { title: '推荐 2：奖励更短回路', text: '不要让连续两次有效反馈隔太久。', vibeId: 'spring-play' },
      { title: '推荐 3：节奏节点化', text: '把“平静 / 紧张 / 释放”变成三个独立阶段。', vibeId: 'danger-bloom' },
    ],
  },
  world: {
    userTitle: '当前节点：世界氛围',
    userText: '我想要软一点的世界，但底下还得有点未知风险。',
    aiText: '最有效的方式不是直接改成深色，而是先把“亮部材质”和“危险音色”拆开。这样世界表面还是友好的，但底色会更有悬念。',
    composer: '输入示例：给我一组“可爱表层 + 隐约危险底色”的世界风格建议。',
    suggestions: [
      { title: '推荐 1：亮面材质', text: '视觉层保留轻和软，把风险藏在声音和留白里。', vibeId: 'spring-play' },
      { title: '推荐 2：危险音色', text: '只在临界点加入偏冷的高频提示。', vibeId: 'danger-bloom' },
      { title: '推荐 3：稀有节点更暗', text: '把未知感压在少量关键节点，不污染全局。', vibeId: 'night-arcade' },
    ],
  },
  button: {
    userTitle: '当前节点：开始按钮',
    userText: '我想让按钮很想点，但又不要像手游商城按钮。',
    aiText: '可以先把体积、圆角和发光分开看。按钮最怕三者一起拉满，那会直接俗掉。',
    composer: '输入示例：帮我做一个“很想点，但不油腻”的开始按钮方向。',
    suggestions: [
      { title: '推荐 1：尺寸先稳', text: '先把按钮占比定稳，再决定要不要更亮。', vibeId: 'paper-proto' },
      { title: '推荐 2：按下去有重量', text: '按压反馈比常亮更重要。', vibeId: 'night-arcade' },
      { title: '推荐 3：留一点克制', text: '不要让 CTA 成为页面里唯一发光物。', vibeId: 'spring-play' },
    ],
  },
  nav: {
    userTitle: '当前节点：导航动线',
    userText: '我想让页面更好逛，但不想用太多箭头和教程。',
    aiText: '先从停留点数量和切换顺序下手。很多时候不是缺提示，而是页面没有明显的节奏节点。',
    composer: '输入示例：给我一套让导航更顺滑的页面切换建议。',
    suggestions: [
      { title: '推荐 1：少一点停留点', text: '先缩短用户要理解的路径，再补提示。', vibeId: 'paper-proto' },
      { title: '推荐 2：转场像接力', text: '当前区域的退出和下一区域的进入要互相接上。', vibeId: 'spring-play' },
    ],
  },
  boss: {
    userTitle: '当前节点：Boss 战节奏',
    userText: '我想让 Boss 更压迫，但不能无脑堆数值。',
    aiText: '建议先改“预警时长、第二阶段进入点、危险反馈密度”。只要这三条线成立，就算数值不暴力，玩家也会感到压迫。',
    composer: '输入示例：帮我把 Boss 战做成“先平静、后压迫、最后突然收束”的节奏。',
    suggestions: [
      { title: '推荐 1：先平静后压迫', text: '把第一个转阶段做成“平静被打断”的感觉。', vibeId: 'danger-bloom' },
      { title: '推荐 2：危险来自反馈密度', text: '不一定靠大伤害，也可以靠更密的预警和音效。', vibeId: 'night-arcade' },
      { title: '推荐 3：高潮后快速收束', text: '让玩家在释放里感到自己真的赢了。', vibeId: 'spring-play' },
    ],
  },
  reward: {
    userTitle: '当前节点：奖励结算页',
    userText: '我想让结算更爽，不要像表单完成页。',
    aiText: '先把战利品展开顺序和升级重音拆出来。结算页最怕信息平铺，应该有一层一层揭开的感觉。',
    composer: '输入示例：帮我做一个“打开战利品”的结算页体验。',
    suggestions: [
      { title: '推荐 1：先掉落后统计', text: '先让玩家看到收获，再给总结。', vibeId: 'spring-play' },
      { title: '推荐 2：强化升级重音', text: '把真正重要的那一项变成最响的一下。', vibeId: 'danger-bloom' },
    ],
  },
  shop: {
    userTitle: '当前节点：商店循环',
    userText: '我想让商店更有选择感，不想只是看价格。',
    aiText: '建议把“重抽节奏、稀有度提示和购买确认”拆成三条线来调。选择感不等于堆更多商品。',
    composer: '输入示例：帮我把商店做得更有选择感和稀有感。',
    suggestions: [
      { title: '推荐 1：少而准', text: '先减少同屏选项，让每张卡更像选择而不是噪音。', vibeId: 'paper-proto' },
      { title: '推荐 2：重抽像赌博', text: '重抽那一下要有心理预期落差。', vibeId: 'night-arcade' },
    ],
  },
  sound: {
    userTitle: '当前节点：音效层',
    userText: '我希望声音更有组织，不是一堆提示同时响。',
    aiText: '先划清层级：命中是基础，危险是打断，胜利是释放。只要角色分工清楚，整体就不会乱。',
    composer: '输入示例：帮我规划命中、危险和胜利三类音效的层级。',
    suggestions: [
      { title: '推荐 1：减少同频提示', text: '多个提示别在同一频段抢位置。', vibeId: 'paper-proto' },
      { title: '推荐 2：把危险做冷', text: '危险音色稍冷一点，更容易立住。', vibeId: 'danger-bloom' },
    ],
  },
}

const SNAKE_VISUAL_LAYOUT_FIELDS = {
  hero: ['canvasWidth', 'canvasHeight', 'background'],
  loop: ['cellSize', 'initialLength'],
  world: ['background', 'gridColor', 'canvasGlow'],
  button: ['headRadius', 'bodyRadius'],
  nav: [],
  boss: [],
  reward: [],
  shop: [],
  sound: [],
}

const WEB_WINDOW_FIELDS = ['pageBg', 'pageTextColor', 'panelBorderColor', 'hudGap', 'canvasRadius', 'hintColor']

function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

function normalizeWebValue(key, rawValue) {
  const field = WEB_FIELD_MAP[key]
  if (!field) return rawValue
  if (field.kind === 'range') return clampNumber(rawValue, field)
  if (field.kind === 'color') return normalizeHex(rawValue, field.defaultValue)
  return rawValue
}

function extractWebDesignValuesFromCode(code = '') {
  const source = String(code || '')
  const shadowAlpha = extractMatch(
    source,
    /canvas\{border:1px solid #[0-9a-fA-F]{3,8};box-shadow:0 0 50px rgba\(\d+,\d+,\d+,([.\d]+)\)/,
    WEB_FIELD_MAP.shadowStrength.defaultValue / 100,
    (match) => Number(match[1]),
  )
  return {
    pageBg: extractMatch(source, /body\{background:(#[0-9a-fA-F]{3,8})/, WEB_FIELD_MAP.pageBg.defaultValue),
    pageTextColor: extractMatch(source, /body\{[^}]*color:(#[0-9a-fA-F]{3,8})/, WEB_FIELD_MAP.pageTextColor.defaultValue),
    panelBorderColor: extractMatch(source, /canvas\{border:1px solid (#[0-9a-fA-F]{3,8})/, WEB_FIELD_MAP.panelBorderColor.defaultValue),
    hintColor: extractMatch(source, /#hint\{[^}]*color:(#[0-9a-fA-F]{3,8})/, WEB_FIELD_MAP.hintColor.defaultValue),
    hudGap: extractMatch(source, /#hud\{[^}]*gap:(\d+)px/, WEB_FIELD_MAP.hudGap.defaultValue, (match) => Number(match[1])),
    hudMargin: extractMatch(source, /#hud\{margin-bottom:(\d+)px/, WEB_FIELD_MAP.hudMargin.defaultValue, (match) => Number(match[1])),
    statSize: extractMatch(source, /\.hv\{font-size:(\d+)px/, WEB_FIELD_MAP.statSize.defaultValue, (match) => Number(match[1])),
    hintSize: extractMatch(source, /#hint\{[^}]*font-size:(\d+)px/, WEB_FIELD_MAP.hintSize.defaultValue, (match) => Number(match[1])),
    canvasRadius: extractMatch(source, /canvas\{[^}]*border-radius:(\d+)px/, WEB_FIELD_MAP.canvasRadius.defaultValue, (match) => Number(match[1])),
    shadowStrength: Math.round(shadowAlpha * 100),
  }
}

function createWebDesignState(code = '') {
  const extracted = extractWebDesignValuesFromCode(code)
  const baseValues = WEB_FIELD_DEFS.reduce((acc, field) => {
    acc[field.key] = normalizeWebValue(field.key, extracted[field.key] ?? field.defaultValue)
    return acc
  }, {})
  return {
    baseValues,
    values: cloneValues(baseValues),
    selectedPresetId: WEB_PRESETS[0].id,
    dirtyKeys: [],
  }
}

function reduceWebDesignState(state, action = {}) {
  const current = state || createWebDesignState()
  if (action.type === 'set-web-field') {
    const values = cloneValues(current.values)
    values[action.key] = normalizeWebValue(action.key, action.value)
    return {
      ...current,
      values,
      dirtyKeys: computeDirtyKeys(values, current.baseValues),
    }
  }
  if (action.type === 'apply-web-preset') {
    const preset = WEB_PRESETS.find((item) => item.id === action.presetId)
    if (!preset) return current
    const values = cloneValues(current.values)
    Object.entries(preset.impacts).forEach(([key, value]) => {
      values[key] = normalizeWebValue(key, value)
    })
    return {
      ...current,
      selectedPresetId: preset.id,
      values,
      dirtyKeys: computeDirtyKeys(values, current.baseValues),
    }
  }
  if (action.type === 'reset-web') {
    return {
      ...current,
      values: cloneValues(current.baseValues),
      dirtyKeys: [],
    }
  }
  if (action.type === 'rebase-web') return createWebDesignState(action.code || '')
  return current
}

export function detectDesignStudioSchema(code = '', files = []) {
  const source = String(code || '')
  if (source.includes('snake=[') && source.includes('GAME OVER')) return 'snake'
  const hasHtml = files.some((file) => file.path?.endsWith('.html')) || /<(main|section|article|button|header|footer)\b/i.test(source)
  const hasCss = files.some((file) => file.path?.endsWith('.css')) || source.includes(':root') || source.includes('box-shadow')
  if (hasHtml && hasCss) return 'web-ui'
  return 'none'
}

function getDefaultNodeIdForSchema(schemaId) {
  if (schemaId === 'snake') return 'hero'
  if (schemaId === 'plants') return 'plants.cherry.core'
  if (schemaId === 'platformer') return 'platformer.player.jump'
  if (schemaId === 'web-ui') return 'web.page.surface'
  return ''
}

function getSnakeStudioSchema(state) {
  const selectedNode = SNAKE_VISUAL_NODE_MAP[state.selectedNodeId] || SNAKE_VISUAL_NODE_MAP.hero
  return {
    id: 'snake',
    label: '贪吃蛇',
    badge: 'Live Schema',
    graphRoot: '游戏体验',
    tree: SNAKE_VISUAL_NODES,
    graphColumns: [],
    visualNodes: SNAKE_VISUAL_NODES,
    boardCards: SNAKE_VISUAL_BOARD,
    chatPanels: SNAKE_VISUAL_CHAT,
    skills: VIBE_PROFILES.map((profile) => ({
      id: profile.id,
      label: profile.label,
      note: profile.note,
      tags: profile.tags,
    })),
    interactiveNodeFields: SNAKE_VISUAL_LAYOUT_FIELDS,
    selectedNode,
  }
}

function getWebUiSchema() {
  return {
    id: 'web-ui',
    label: 'Web Design',
    badge: 'Live Tokens',
    graphRoot: 'Web UI',
    tree: WEB_UI_TREE,
    graphColumns: [
      [{ id: 'web.page.surface', label: '页面 > 画布', note: '底色 / 正文 / 边框' }],
      [{ id: 'web.layout.spacing', label: '布局 > 信息密度', note: 'HUD 间距 / 下边距 / 字号' }],
      [{ id: 'web.motion.shell', label: '表现 > 细节反馈', note: '提示色 / 圆角 / 阴影' }],
    ],
    skills: WEB_UI_SKILLS,
    interactiveNodeFields: WEB_NODE_FIELDS,
  }
}

function getStudioSchema(state) {
  const schemaId = state.schemaId
  if (schemaId === 'snake') return getSnakeStudioSchema(state)
  if (schemaId === 'web-ui') return getWebUiSchema()
  return TEMPLATE_SCHEMAS[schemaId] || { id: 'none', label: '无 schema', badge: 'Schema Missing', graphRoot: 'Schema Hidden', tree: [], graphColumns: [], inspector: {}, skills: [] }
}

function flattenSchemaNodes(tree = []) {
  return tree.flatMap((node) => [node, ...(node.children ? flattenSchemaNodes(node.children) : [])])
}

function getStudioSelectedNode(schema, nodeId) {
  if (schema.selectedNode) return schema.selectedNode
  return flattenSchemaNodes(schema.tree || []).find((node) => node.id === nodeId) || null
}

function getStudioDescription(schema, nodeId) {
  if (schema.id === 'snake') {
    const card = schema.boardCards?.[nodeId]?.[0]
    if (card) return { title: card.title, note: card.note, tags: card.tags || [] }
  }
  if (schema.id === 'web-ui') {
    return {
      title: '网页层像一套可协作的 HUD',
      note: '页面外壳、信息密度和提示反馈都在这里统一收口，不再拆成重复的窗口。',
      tags: ['HUD', '网页层', '统一控制'],
    }
  }
  const node = getStudioSelectedNode(schema, nodeId)
  if (node) return { title: node.label, note: node.note || `${schema.label} 的当前焦点节点。`, tags: [schema.label, '当前节点'] }
  return {
    title: `${schema.label} 设计概览`,
    note: '这里展示游戏说明、实时状态、最近更改和任务规划。',
    tags: [schema.label, '概览'],
  }
}

function mergeDefined(target, source = {}) {
  const next = { ...target }
  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined) next[key] = value
  })
  return next
}

function getGraphNodesForSchema(schema) {
  if (schema.visualNodes?.length) return schema.visualNodes
  if (schema.graphColumns?.length) {
    const seen = new Set()
    return schema.graphColumns.flat().filter((node) => {
      if (!node?.id || seen.has(node.id)) return false
      seen.add(node.id)
      return true
    })
  }
  return flattenSchemaNodes(schema.tree || []).filter((node) => !node.children?.length)
}

function createDefaultGraphNodeStates(schema, selectedNodeId = '') {
  const nodes = getGraphNodesForSchema(schema)
  return nodes.reduce((acc, node, index) => {
    if (node.id === selectedNodeId) acc[node.id] = 'in-progress'
    else if (index === 0) acc[node.id] = 'todo'
    else if (index === nodes.length - 1) acc[node.id] = 'done'
    else acc[node.id] = 'todo'
    return acc
  }, {})
}

function createDefaultGraphSummary(schema, nodeLabel = '') {
  if (schema.id === 'snake') {
    return {
      concept: '贪吃蛇游戏',
      consensus: ['基础玩法先稳住经典贪吃蛇节奏', `当前焦点先收敛到 ${nodeLabel || '当前节点'}`],
      nextSteps: ['下一步：把当前节点拆成可执行设计卡片'],
      openQuestions: ['碰撞、奖励和提示音应该先优化哪一条线？'],
      conflicts: ['玩法压力和首页轻松感之间还需要继续平衡。'],
    }
  }

  return {
    concept: schema.graphRoot || schema.label,
    consensus: [`${schema.label} 已进入结构化梳理阶段`],
    nextSteps: ['下一步：确认当前节点的实现优先级'],
    openQuestions: ['哪些节点应该先和编辑器做跳转联动？'],
    conflicts: ['当前还没有明显冲突。'],
  }
}

function normalizeGraphSummary(summary, fallback) {
  const current = summary && typeof summary === 'object' ? summary : {}
  return {
    concept: current.concept || fallback.concept,
    consensus: Array.isArray(current.consensus) && current.consensus.length ? current.consensus : fallback.consensus,
    nextSteps: Array.isArray(current.nextSteps) && current.nextSteps.length ? current.nextSteps : fallback.nextSteps,
    openQuestions: Array.isArray(current.openQuestions) && current.openQuestions.length ? current.openQuestions : fallback.openQuestions,
    conflicts: Array.isArray(current.conflicts) && current.conflicts.length ? current.conflicts : fallback.conflicts,
  }
}

function getVisibleGraphNodes(schema, state, runtime) {
  const nodes = getGraphNodesForSchema(schema)
  if (state.graphView === 'global') return nodes
  const mineIds = new Set([state.selectedNodeId, ...(runtime.graphMineNodeIds || [])].filter(Boolean))
  const filtered = nodes.filter((node) => mineIds.has(node.id))
  return filtered.length ? filtered : nodes.slice(0, 1)
}

function getGraphNodeStatus(runtime, nodeId, fallbackStates) {
  const raw = runtime.graphNodeStates?.[nodeId] || fallbackStates[nodeId] || 'todo'
  return Object.prototype.hasOwnProperty.call(DESIGN_GRAPH_STATUS, raw) ? raw : 'todo'
}

function renderGraphSummaryBlock(title, items, tone, dataKey) {
  return `
    <article class="studio-window__panel-block studio-window__panel-block--${tone}" data-design-graph-summary="${dataKey}">
      <div class="studio-window__section-head">
        <strong>${escapeHtml(title)}</strong>
        <span>${items.length}</span>
      </div>
      <div class="studio-window__hud-list">
        ${items
          .map((item) => `<div class="studio-window__hud-list-item"><b>${escapeHtml(item)}</b></div>`)
          .join('')}
      </div>
    </article>
  `
}

function getDesignAgentCards(schema, state) {
  if (schema.id === 'snake') {
    const panel = schema.chatPanels?.[state.selectedNodeId] || schema.chatPanels?.hero
    return (panel?.suggestions || []).map((item, index) => {
      const profile = VIBE_PROFILES.find((entry) => entry.id === item.vibeId)
      const tokens = profile
        ? Object.entries(profile.impacts)
            .slice(0, 3)
            .map(([key, value]) => ({
              label: PARAM_MAP[key]?.label || key,
              value: String(value),
              swatch: typeof value === 'string' && /^#/.test(value) ? value : '',
            }))
        : []
      return {
        id: `${state.selectedNodeId || 'node'}-${index}`,
        title: item.title,
        note: item.text,
        vibeId: item.vibeId || '',
        tokens,
      }
    })
  }

  return (schema.skills || []).map((skill) => ({
    id: skill.id,
    title: skill.label,
    note: skill.note,
    vibeId: skill.id,
    tokens: (skill.tags || []).slice(0, 3).map((tag) => ({ label: '标签', value: tag, swatch: '' })),
  }))
}

function renderDesignAgentCard(card) {
  return `
    <article class="studio-window__suggestion" data-design-agent-card="${card.id}">
      <strong>${escapeHtml(card.title)}</strong>
      <span>${escapeHtml(card.note)}</span>
      ${
        card.tokens.length
          ? `<div class="studio-window__tags">
              ${card.tokens
                .map((token) => `<span>${token.swatch ? `<i style="background:${escapeHtml(token.swatch)}"></i>` : ''}${escapeHtml(token.label)} ${escapeHtml(token.value)}</span>`)
                .join('')}
            </div>`
          : ''
      }
      <div class="studio-window__actions">
        ${card.vibeId ? `<button class="is-primary" data-studio-vibe-id="${card.vibeId}">应用到游戏</button>` : ''}
        <button data-design-agent-pin="${card.id}">固定到智慧树</button>
      </div>
    </article>
  `
}

function createStudioRuntime(state = {}, overrides = {}) {
  const schema = getStudioSchema(state)
  const selectedNode = getStudioSelectedNode(schema, state.selectedNodeId)
  const description = getStudioDescription(schema, state.selectedNodeId)
  const dirtyCount = (state?.snakeState?.dirtyKeys?.length || 0) + (state?.webState?.dirtyKeys?.length || 0)
  const nodeLabel = selectedNode?.label || state.selectedNodeId || '未选节点'
  const fallbackSummary = createDefaultGraphSummary(schema, nodeLabel)
  const fallbackNodeStates = createDefaultGraphNodeStates(schema, state.selectedNodeId)
  const fallbackMineNodeIds = state.selectedNodeId ? [state.selectedNodeId] : []
  const fallbackChanges = [
    { title: '等待第一次设计落地', detail: '应用一次设计后，这里会开始记录。', time: '--:--' },
  ]
  const fallbackTasks = [
    { id: 'focus', text: `细化 ${nodeLabel}`, done: false },
    { id: 'preview', text: '跑一次游戏预览', done: false },
    { id: 'vibe', text: '让 AI 给 3 个 vibe 方向', done: false },
  ]

  const runtime = mergeDefined({
    schemaLabel: schema.label,
    nodeLabel,
    focusLabel: nodeLabel,
    descriptionTitle: description.title,
    descriptionNote: description.note,
    descriptionTags: description.tags || [],
    previewRunning: false,
    peers: 1,
    dirtyCount,
    lastAppliedAt: '未应用',
    graphSummary: fallbackSummary,
    graphMineNodeIds: fallbackMineNodeIds,
    graphNodeStates: fallbackNodeStates,
    changes: fallbackChanges,
    tasks: fallbackTasks,
  }, overrides)

  runtime.changes = Array.isArray(runtime.changes) && runtime.changes.length ? runtime.changes : fallbackChanges
  runtime.tasks = Array.isArray(runtime.tasks) && runtime.tasks.length ? runtime.tasks : fallbackTasks
  runtime.dirtyCount = typeof runtime.dirtyCount === 'number' ? runtime.dirtyCount : dirtyCount
  runtime.graphMineNodeIds = Array.isArray(runtime.graphMineNodeIds) && runtime.graphMineNodeIds.length ? runtime.graphMineNodeIds : fallbackMineNodeIds
  runtime.graphNodeStates = runtime.graphNodeStates && typeof runtime.graphNodeStates === 'object' ? runtime.graphNodeStates : fallbackNodeStates
  runtime.graphSummary = normalizeGraphSummary(runtime.graphSummary, fallbackSummary)
  return runtime
}

function getRuntimeCarry(runtime = {}) {
  return {
    peers: runtime.peers,
    previewRunning: runtime.previewRunning,
    lastAppliedAt: runtime.lastAppliedAt,
    changes: runtime.changes,
    tasks: runtime.tasks,
    graphSummary: runtime.graphSummary,
    graphMineNodeIds: runtime.graphMineNodeIds,
    graphNodeStates: runtime.graphNodeStates,
  }
}

function withStudioRuntime(state, runtimeOverrides = {}) {
  return {
    ...state,
    runtime: createStudioRuntime(state, { ...getRuntimeCarry(state.runtime || {}), ...(runtimeOverrides || {}) }),
  }
}

function getInteractiveFieldDefs(schema, state, nodeId) {
  const fieldDefs = schema.interactiveNodeFields?.[nodeId] || []
  return fieldDefs
    .map((definition) => {
      if (typeof definition === 'string') {
        if (schema.id === 'snake') return { field: PARAM_MAP[definition], value: state.snakeState.values[definition], kind: 'snake' }
        if (schema.id === 'web-ui') return { field: WEB_FIELD_MAP[definition], value: state.webState.values[definition], kind: 'web' }
        return null
      }
      if (definition?.kind === 'web') return { field: WEB_FIELD_MAP[definition.key], value: state.webState.values[definition.key], kind: 'web' }
      if (definition?.kind === 'snake') return { field: PARAM_MAP[definition.key], value: state.snakeState.values[definition.key], kind: 'snake' }
      return null
    })
    .filter(Boolean)
}

function getSnakeStudioFieldKeysForNode(nodeId) {
  return (SNAKE_VISUAL_LAYOUT_FIELDS[nodeId] || []).filter((key) => PARAM_MAP[key])
}

function reduceSnakeStudioState(current, action = {}, selectedNodeId = '') {
  if (action.type === 'set-field' || action.type === 'reset-all') {
    return reduceDesignWorkbenchState(current, action)
  }

  const scopedKeys = getSnakeStudioFieldKeysForNode(selectedNodeId)
  if (!scopedKeys.length) return current

  if (action.type === 'reset-node') {
    const values = cloneValues(current.values)
    scopedKeys.forEach((key) => {
      values[key] = current.baseValues[key]
    })
    return {
      ...current,
      values,
      dirtyKeys: computeDirtyKeys(values, current.baseValues),
    }
  }

  if (action.type === 'apply-vibe') {
    const profile = VIBE_PROFILES.find((item) => item.id === action.vibeId)
    if (!profile) return current
    const values = cloneValues(current.values)
    Object.entries(profile.impacts).forEach(([key, value]) => {
      if (scopedKeys.includes(key)) values[key] = normalizeFieldValue(key, value)
    })
    return {
      ...current,
      selectedVibeId: profile.id,
      values,
      dirtyKeys: computeDirtyKeys(values, current.baseValues),
    }
  }

  return current
}

export function createDesignStudioState(code = '', files = []) {
  const autoSchemaId = detectDesignStudioSchema(code, files)
  const schemaId = autoSchemaId
  return withStudioRuntime({
    autoSchemaId,
    schemaId,
    selectedNodeId: getDefaultNodeIdForSchema(schemaId),
    selectedVibeId: schemaId === 'snake' ? 'night-arcade' : schemaId === 'web-ui' ? 'web-product' : '',
    vibeScope: 'node',
    graphView: 'mine',
    designPreviewTab: 'tokens',
    designPreviewSkin: DESIGN_PREVIEW_SKINS[0].id,
    snakeState: createDesignWorkbenchState(code),
    webState: createWebDesignState(code),
  })
}

export function reduceDesignStudioState(state, action = {}) {
  const current = state || createDesignStudioState()
  if (action.type === 'set-schema') {
    return withStudioRuntime({
      ...current,
      schemaId: action.schemaId || current.schemaId,
      selectedNodeId: getDefaultNodeIdForSchema(action.schemaId || current.schemaId),
    })
  }
  if (action.type === 'select-node') {
    return withStudioRuntime({ ...current, selectedNodeId: action.nodeId || current.selectedNodeId })
  }
  if (action.type === 'set-vibe-scope') {
    return withStudioRuntime({ ...current, vibeScope: action.scope || current.vibeScope })
  }
  if (action.type === 'set-graph-view') {
    return withStudioRuntime({ ...current, graphView: action.view || current.graphView })
  }
  if (action.type === 'set-design-preview-tab') {
    return withStudioRuntime({ ...current, designPreviewTab: action.tab || current.designPreviewTab })
  }
  if (action.type === 'set-design-preview-skin') {
    return withStudioRuntime({ ...current, designPreviewSkin: action.skinId || current.designPreviewSkin })
  }
  if (action.type === 'set-runtime') {
    return withStudioRuntime(current, action.runtime || {})
  }
  if (action.type === 'set-field' || action.type === 'apply-vibe' || action.type === 'reset-node' || action.type === 'reset-all') {
    return withStudioRuntime({
      ...current,
      snakeState: current.schemaId === 'snake' ? reduceSnakeStudioState(current.snakeState, action, current.selectedNodeId) : reduceDesignWorkbenchState(current.snakeState, action),
      selectedVibeId: action.type === 'apply-vibe' ? action.vibeId || current.selectedVibeId : current.selectedVibeId,
    })
  }
  if (action.type === 'set-web-field' || action.type === 'apply-web-preset' || action.type === 'reset-web') {
    return withStudioRuntime({
      ...current,
      webState: reduceWebDesignState(current.webState, action),
      selectedVibeId: action.type === 'apply-web-preset' ? action.presetId || current.selectedVibeId : current.selectedVibeId,
    })
  }
  if (action.type === 'rebase') {
    const fresh = createDesignStudioState(action.code || '', action.files || [])
    return withStudioRuntime({
      ...fresh,
      schemaId: current.schemaId,
      selectedNodeId: getDefaultNodeIdForSchema(current.schemaId),
    }, current.runtime || {})
  }
  return current
}

function renderStudioFieldControl(definition) {
  const { field, value, kind } = definition
  if (!field) return ''
  const dataKey = kind === 'web' ? 'data-web-field-key' : 'data-design-param-key'
  if (field.kind === 'range') {
    return `
      <label class="studio-window__field">
        <span class="studio-window__field-head">
          <span>${escapeHtml(field.label)}</span>
          <b>${escapeHtml(value)}${field.unit ? ` ${escapeHtml(field.unit)}` : ''}</b>
        </span>
        <input class="studio-window__range" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${value}" ${dataKey}="${field.key}">
      </label>
    `
  }
  return `
    <label class="studio-window__field">
      <span class="studio-window__field-head">
        <span>${escapeHtml(field.label)}</span>
        <b>${escapeHtml(value)}</b>
      </span>
      <span class="studio-window__color-row">
        <input class="studio-window__color" type="color" value="${escapeHtml(value)}" ${dataKey}="${field.key}">
        <input class="studio-window__text" type="text" value="${escapeHtml(value)}" ${dataKey}="${field.key}">
      </span>
    </label>
  `
}

function renderReadonlyInspector(block) {
  if (!block) return `
    <div class="studio-window__empty">
      <strong>当前 schema 还没有对象参数</strong>
      <span>这里不会硬造假的检查器条目。</span>
    </div>
  `

  return `
    <div class="studio-window__copy">${escapeHtml(block.copy)}</div>
    <div class="studio-window__meter-list">
      ${block.fields
        .map((field) => `
          <div class="studio-window__meter">
            <label>${escapeHtml(field.label)}</label>
            <div class="studio-window__meter-rail" style="--fill:${field.fill}"></div>
            <b>${escapeHtml(field.value)}</b>
          </div>
        `)
        .join('')}
    </div>
    <div class="studio-window__schema-list">
      ${block.schema.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}
    </div>
  `
}

export function renderDesignTreeWindow(container, state) {
  if (!container) return
  const runtime = state.runtime || createStudioRuntime(state)
  container.innerHTML = `
    <div class="studio-window studio-window--hud">
      <div class="studio-window__hud-grid">
        <article class="studio-window__hud-card studio-window__hud-card--wide">
          <div class="studio-window__section-head">
            <strong>游戏概览</strong>
            <span>${escapeHtml(runtime.schemaLabel)}</span>
          </div>
          <div class="studio-window__hud-copy">
            <b>${escapeHtml(runtime.descriptionTitle)}</b>
            <p>${escapeHtml(runtime.descriptionNote)}</p>
          </div>
          <div class="studio-window__tags">
            ${(runtime.descriptionTags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </article>
        <article class="studio-window__hud-card">
          <div class="studio-window__section-head">
            <strong>游戏实时状态</strong>
            <span>${escapeHtml(runtime.nodeLabel)}</span>
          </div>
          <div class="studio-window__hud-stats">
            <div class="studio-window__hud-stat"><label>当前节点</label><b>${escapeHtml(runtime.nodeLabel)}</b></div>
            <div class="studio-window__hud-stat"><label>在线协作</label><b>${escapeHtml(runtime.peers)} 人</b></div>
            <div class="studio-window__hud-stat"><label>预览状态</label><b>${runtime.previewRunning ? '运行中' : '待机中'}</b></div>
            <div class="studio-window__hud-stat"><label>待应用</label><b>${escapeHtml(runtime.dirtyCount)} 项</b></div>
          </div>
        </article>
        <article class="studio-window__hud-card">
          <div class="studio-window__section-head">
            <strong>游戏更改记录</strong>
            <span>${escapeHtml(runtime.lastAppliedAt || '--:--')}</span>
          </div>
          <div class="studio-window__hud-list">
            ${(runtime.changes || [])
              .slice(0, 3)
              .map(
                (item) => `
              <div class="studio-window__hud-list-item">
                <b>${escapeHtml(item.title || '最近改动')}</b>
                <span>${escapeHtml(item.detail || '')}</span>
                <small>${escapeHtml(item.time || '--:--')}</small>
              </div>
            `,
              )
              .join('')}
          </div>
        </article>
        <article class="studio-window__hud-card">
          <div class="studio-window__section-head">
            <strong>任务规划</strong>
            <span>${(runtime.tasks || []).filter((item) => item.done).length}/${(runtime.tasks || []).length}</span>
          </div>
          <div class="studio-window__hud-list">
            ${(runtime.tasks || [])
              .slice(0, 4)
              .map(
                (item, index) => `
              <div class="studio-window__task-row" data-task-plan-item="${index}">
                <i class="${item.done ? 'is-done' : ''}"></i>
                <span>${escapeHtml(item.text || '待补充任务')}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        </article>
      </div>
    </div>
  `
}

export function renderDesignGraphWindow(container, state) {
  if (!container) return
  const schema = getStudioSchema(state)
  const runtime = state.runtime || createStudioRuntime(state)
  const summary = normalizeGraphSummary(runtime.graphSummary, createDefaultGraphSummary(schema, runtime.nodeLabel))
  const fallbackStates = createDefaultGraphNodeStates(schema, state.selectedNodeId)
  const visibleNodes = getVisibleGraphNodes(schema, state, runtime)

  container.innerHTML = `
    <div class="studio-window studio-window--graph">
      <div class="studio-window__hero">
        <strong>智慧树</strong>
        <span>${escapeHtml(schema.label)} · 可视化任务/结构树 + AI 整理</span>
      </div>
      <div class="studio-window__scope">
        <button class="${state.graphView === 'mine' ? 'is-active' : ''}" data-design-graph-view="mine">我的任务</button>
        <button class="${state.graphView === 'global' ? 'is-active' : ''}" data-design-graph-view="global">全局</button>
        <button class="is-primary" data-design-graph-action="organize">AI 整理</button>
        <button data-design-graph-action="add-node">+ 添加</button>
        ${state.selectedNodeId ? `<button data-design-graph-action="remove-node" data-design-graph-node-id="${state.selectedNodeId}">删除</button>` : ''}
      </div>
      ${
        !visibleNodes.length
          ? `<div class="studio-window__empty"><strong>当前无结构图</strong><span>没有 schema，就不假装有对象图。</span></div>`
          : `
            <div class="studio-window__graph-root">${escapeHtml(summary.concept || schema.graphRoot)}</div>
            <div class="studio-window__graph-grid">
              ${visibleNodes
                .map((node) => {
                  const status = getGraphNodeStatus(runtime, node.id, fallbackStates)
                  return `
                    <button class="studio-window__graph-node${state.selectedNodeId === node.id ? ' is-active' : ''}" data-studio-node-id="${node.id}" data-design-graph-status="${status}">
                      ${node.eyebrow ? `<small>${escapeHtml(node.eyebrow)}</small>` : ''}
                      <strong>${escapeHtml(node.label)}</strong>
                      <span>${escapeHtml(node.note || '')}</span>
                      <b>${escapeHtml(DESIGN_GRAPH_STATUS[status])}</b>
                    </button>
                  `
                })
                .join('')}
            </div>
            <div class="studio-window__graph-summary">
              ${renderGraphSummaryBlock('游戏概念', [summary.concept].filter(Boolean), 'consensus', 'concept')}
              ${renderGraphSummaryBlock('功能模块', summary.consensus, 'consensus', 'consensus')}
            </div>
          `
      }
    </div>
  `
}

export function renderDesignInspectorWindow(container, state) {
  if (!container) return
  const schema = getStudioSchema(state)
  const interactiveFields = getInteractiveFieldDefs(schema, state, state.selectedNodeId)
  const readonlyBlock = schema.inspector?.[state.selectedNodeId]
  const title = readonlyBlock?.title || schema.selectedNode?.label || state.selectedNodeId || '选择一个节点'
  const copy = readonlyBlock?.copy || (schema.id === 'snake' ? '当前节点支持直接写回代码。' : schema.id === 'web-ui' ? '当前节点走 Web Design 令牌。' : '这个 schema 目前主要用于结构规划。')

  if (schema.id === 'snake') {
    container.innerHTML = `
      <div class="studio-window studio-window--layout">
        <div class="studio-window__mini-head"><strong>${escapeHtml(schema.selectedNode?.label || title)}</strong><span>结构与布局</span></div>
        ${
          interactiveFields.length
            ? `<div class="studio-window__field-list">${interactiveFields.map(renderStudioFieldControl).join('')}</div>`
            : `<div class="studio-window__empty"><strong>当前节点暂无布局项</strong><span>先在左侧画布和右侧聊天里继续定方向。</span></div>`
        }
        <div class="studio-window__actions">
          <button data-studio-action="reset-node">重置节点</button>
          <button class="is-primary" data-studio-action="apply-design">应用结构与布局</button>
        </div>
      </div>
    `
    return
  }

  container.innerHTML = `
    <div class="studio-window studio-window--inspector">
      <div class="studio-window__hero">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(copy)}</span>
      </div>
      ${
        interactiveFields.length
          ? `<div class="studio-window__field-list">${interactiveFields.map(renderStudioFieldControl).join('')}</div>`
          : renderReadonlyInspector(readonlyBlock)
      }
      <div class="studio-window__actions">
        <button data-studio-action="reset-node">重置节点</button>
        <button class="is-primary" data-studio-action="apply-design">应用设计</button>
      </div>
    </div>
  `
}

export function renderVibeSkillsWindow(container, state) {
  if (!container) return

  container.innerHTML = `
    <div class="studio-window studio-window--chat">
      <div class="studio-window__mini-head"><strong>设计参考</strong><span>游戏视觉灵感与 AI 辅助</span></div>
      <div class="studio-window__ref-scroll">

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>风格方向</strong><span>选一个基调</span></div>
          <div class="studio-window__style-grid">
            ${DESIGN_STYLE_REFS.map((s) => `
              <button class="studio-window__style-card" data-design-style-id="${s.id}">
                <i style="background:${escapeHtml(s.accent)}"></i>
                <strong>${escapeHtml(s.label)}</strong>
                <span>${escapeHtml(s.note)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>色彩参考</strong><span>点击复制色值</span></div>
          ${DESIGN_COLOR_PALETTES.map((p) => `
            <button class="studio-window__palette-row" data-design-palette-id="${p.id}">
              <span class="studio-window__palette-label">${escapeHtml(p.label)}</span>
              <span class="studio-window__palette-dots">
                ${p.colors.map((c) => `<i class="studio-window__palette-dot" style="background:${escapeHtml(c)}" title="${escapeHtml(c)}"></i>`).join('')}
              </span>
            </button>
          `).join('')}
          <div class="studio-window__scope">
            <button class="is-primary" data-design-ai-prompt="scene-color">AI 生成配色</button>
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>角色参考</strong><span>主角风格方向</span></div>
          <div class="studio-window__style-grid">
            ${DESIGN_CHAR_REFS.map((c) => `
              <button class="studio-window__style-card studio-window__style-card--char" data-design-char-id="${c.id}">
                <strong>${escapeHtml(c.label)}</strong>
                <span>${escapeHtml(c.note)}</span>
                <div class="studio-window__tags">${c.keywords.map((k) => `<span>${escapeHtml(k)}</span>`).join('')}</div>
              </button>
            `).join('')}
          </div>
          <div class="studio-window__scope">
            <button class="is-primary" data-design-ai-prompt="char-gen">AI 生成角色概念</button>
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>灵感网站</strong><span>点击跳转</span></div>
          <div class="studio-window__site-list">
            ${DESIGN_INSPIRATION_SITES.map((s) => `
              <a class="studio-window__site-link" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" data-design-site-id="${s.id}">
                <strong>${escapeHtml(s.label)}</strong>
                <span>${escapeHtml(s.note)}</span>
              </a>
            `).join('')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>AI 视觉生成</strong><span>发送到 AI 助手</span></div>
          <textarea class="studio-window__ai-textarea" id="design-agent-prompt" rows="3" placeholder="描述你想要的游戏视觉风格，或从上面选择参考后点击发送..."></textarea>
          <div class="studio-window__scope">
            ${DESIGN_AI_PROMPTS.map((p) => `<button data-design-ai-prompt="${p.id}" title="${escapeHtml(p.prompt)}">${escapeHtml(p.label)}</button>`).join('')}
          </div>
          <div class="studio-window__actions">
            <button class="is-primary" data-design-send-ai="true">发送到 AI 助手</button>
          </div>
        </div>

      </div>
    </div>
  `
}

export function renderWebDesignWindow(container, state) {
  if (!container) return
  const webValues = state.webState?.values || {}
  const snakeValues = state.snakeState?.values || {}
  const webDirty = state.webState?.dirtyKeys?.length || 0
  const snakeDirty = state.snakeState?.dirtyKeys?.length || 0
  const dirtyCount = webDirty + snakeDirty
  const activePresetId = state.webState?.selectedPresetId || ''
  const activeSkin = state.designPreviewSkin || DESIGN_PREVIEW_SKINS[0].id

  const canvasW = snakeValues.canvasWidth ?? PARAM_MAP.canvasWidth.defaultValue
  const canvasH = snakeValues.canvasHeight ?? PARAM_MAP.canvasHeight.defaultValue
  const bgVal = snakeValues.background ?? PARAM_MAP.background.defaultValue

  const pageBg = webValues.pageBg || WEB_FIELD_MAP.pageBg.defaultValue
  const textColor = webValues.pageTextColor || WEB_FIELD_MAP.pageTextColor.defaultValue
  const borderColor = webValues.panelBorderColor || WEB_FIELD_MAP.panelBorderColor.defaultValue
  const hintColor = webValues.hintColor || WEB_FIELD_MAP.hintColor.defaultValue
  const radius = webValues.canvasRadius ?? WEB_FIELD_MAP.canvasRadius.defaultValue
  const statSize = webValues.statSize ?? WEB_FIELD_MAP.statSize.defaultValue
  const hintSize = webValues.hintSize ?? WEB_FIELD_MAP.hintSize.defaultValue
  const shadowStr = webValues.shadowStrength ?? WEB_FIELD_MAP.shadowStrength.defaultValue

  function webRange(key, label) {
    const field = WEB_FIELD_MAP[key]
    if (!field) return ''
    const val = webValues[key] ?? field.defaultValue
    return `
      <label class="webdesign__range-field">
        <span class="webdesign__range-head">
          <span>${escapeHtml(label)}</span>
          <b>${escapeHtml(val)}${field.unit ? ' ' + escapeHtml(field.unit) : ''}</b>
        </span>
        <input class="webdesign__range-input" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${val}" data-web-field-key="${field.key}">
      </label>
    `
  }

  function gameRange(key, label) {
    const field = PARAM_MAP[key]
    if (!field) return ''
    const val = snakeValues[key] ?? field.defaultValue
    return `
      <label class="webdesign__range-field">
        <span class="webdesign__range-head">
          <span>${escapeHtml(label)}</span>
          <b>${escapeHtml(val)}${field.unit ? ' ' + escapeHtml(field.unit) : ''}</b>
        </span>
        <input class="webdesign__range-input" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${val}" data-design-param-key="${field.key}">
      </label>
    `
  }

  container.innerHTML = `
    <div class="studio-window studio-window--web">
      <div class="studio-window__mini-head">
        <strong>UI 设计台</strong>
        <span>${dirtyCount ? dirtyCount + ' 项待应用' : '当前无修改'}</span>
      </div>
      <div class="studio-window__web-scroll">

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>预览外壳</strong><span>展示风格</span></div>
          <div class="webdesign__skin-grid">
            ${DESIGN_PREVIEW_SKINS.map((skin) => `
              <button class="webdesign__skin-btn${activeSkin === skin.id ? ' is-active' : ''}" data-design-preview-skin="${skin.id}">
                <strong>${escapeHtml(skin.label)}</strong>
                <span>${escapeHtml(skin.note)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>预设方案</strong><span>一键切换</span></div>
          <div class="webdesign__preset-grid">
            ${WEB_PRESETS.map((preset) => {
              const active = activePresetId === preset.id
              return `
                <button class="webdesign__preset-card${active ? ' is-active' : ''}" data-web-preset-id="${preset.id}">
                  <div class="webdesign__preset-colors">
                    <i style="background:${escapeHtml(preset.impacts.pageBg || '#050912')}"></i>
                    <i style="background:${escapeHtml(preset.impacts.pageTextColor || '#c0d4f0')}"></i>
                    <i style="background:${escapeHtml(preset.impacts.panelBorderColor || '#132040')}"></i>
                    <i style="background:${escapeHtml(preset.impacts.hintColor || '#4a6890')}"></i>
                  </div>
                  <strong>${escapeHtml(preset.label)}</strong>
                  <span>${escapeHtml(preset.note)}</span>
                </button>
              `
            }).join('')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>页面配色</strong><span>4 项</span></div>
          <div class="webdesign__color-grid">
            ${[
              { key: 'pageBg', label: '页面底色', val: pageBg },
              { key: 'pageTextColor', label: '文字颜色', val: textColor },
              { key: 'panelBorderColor', label: '边框颜色', val: borderColor },
              { key: 'hintColor', label: '提示文字', val: hintColor },
            ].map((f) => `
              <label class="webdesign__color-field" data-web-field-key="${f.key}">
                <input class="webdesign__color-input" type="color" value="${escapeHtml(f.val)}" data-web-field-key="${f.key}">
                <span class="webdesign__color-label">${escapeHtml(f.label)}</span>
                <span class="webdesign__color-hex">${escapeHtml(f.val)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>画布</strong><span>尺寸与边框</span></div>
          <div class="webdesign__range-list">
            ${gameRange('canvasWidth', '画布宽度')}
            ${gameRange('canvasHeight', '画布高度')}
            ${gameRange('canvasGlow', '边框辉光')}
            ${webRange('canvasRadius', '画布圆角')}
            ${webRange('shadowStrength', '阴影强度')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>排版</strong><span>间距与字号</span></div>
          <div class="webdesign__range-list">
            ${webRange('hudGap', 'HUD 间距')}
            ${webRange('hudMargin', 'HUD 下边距')}
            ${webRange('statSize', '数字字号')}
            ${webRange('hintSize', '提示字号')}
          </div>
        </div>

        <div class="studio-window__panel-block">
          <div class="studio-window__section-head"><strong>实时预览</strong><span>当前效果</span></div>
          <div class="webdesign__preview-strip" style="background:${escapeHtml(pageBg)};border-color:${escapeHtml(borderColor)};border-radius:${radius}px;box-shadow:0 0 ${Math.round(shadowStr * 0.5)}px ${escapeHtml(borderColor)}">
            <span class="webdesign__preview-canvas" style="background:${escapeHtml(bgVal)};border:1px solid ${escapeHtml(borderColor)};border-radius:${radius}px;width:${Math.min(canvasW, 200)}px;height:${Math.min(canvasH * 0.3, 48)}px"></span>
            <span class="webdesign__preview-text" style="color:${escapeHtml(textColor)};font-size:${statSize}px">SCORE 120</span>
            <span class="webdesign__preview-hint" style="color:${escapeHtml(hintColor)};font-size:${hintSize}px">按方向键移动</span>
          </div>
        </div>

      </div>
      <div class="studio-window__actions">
        <button data-studio-action="reset-web">还原默认</button>
        <button class="is-primary" data-studio-action="apply-design">应用到游戏</button>
      </div>
    </div>
  `
}

function applyWebDesignStateToCode(code, webState) {
  const source = String(code || '')
  const values = webState?.values || createWebDesignState().values
  const shadowColor = hexToRgba(values.panelBorderColor, Math.max(0, Number(values.shadowStrength) || 0) / 100)
  let next = source
  next = replaceFirst(next, /body\{background:[^;]+/, `body{background:${values.pageBg}`)
  next = replaceFirst(next, /body\{[^}]*color:#[0-9a-fA-F]{3,8}/, (match) => match.replace(/color:#[0-9a-fA-F]{3,8}/, `color:${values.pageTextColor}`))
  next = replaceFirst(next, /#hud\{margin-bottom:\d+px;display:flex;align-items:center;gap:\d+px;text-align:center\}/, `#hud{margin-bottom:${values.hudMargin}px;display:flex;align-items:center;gap:${values.hudGap}px;text-align:center}`)
  next = replaceFirst(next, /\.hv\{font-size:\d+px/, `.hv{font-size:${values.statSize}px`)
  next = replaceFirst(next, /#hint\{margin-top:\d+px;font-size:\d+px;color:#[0-9a-fA-F]{3,8}/, `#hint{margin-top:12px;font-size:${values.hintSize}px;color:${values.hintColor}`)
  if (/canvas\{border:1px solid #[0-9a-fA-F]{3,8};box-shadow:[^}]*;border-radius:\d+px\}/.test(next)) {
    next = replaceFirst(next, /canvas\{border:1px solid #[0-9a-fA-F]{3,8};box-shadow:[^;]+;border-radius:\d+px\}/, `canvas{border:1px solid ${values.panelBorderColor};box-shadow:0 0 50px ${shadowColor};border-radius:${values.canvasRadius}px}`)
  } else if (/canvas\{border:1px solid #[0-9a-fA-F]{3,8};box-shadow:[^}]*\}/.test(next)) {
    next = replaceFirst(next, /canvas\{border:1px solid #[0-9a-fA-F]{3,8};box-shadow:[^}]*\}/, `canvas{border:1px solid ${values.panelBorderColor};box-shadow:0 0 50px ${shadowColor};border-radius:${values.canvasRadius}px}`)
  }
  return next
}

export function applyDesignStudioStateToCode(code, state) {
  let next = String(code || '')
  if (state?.snakeState?.dirtyKeys?.length) next = applyDesignStateToCode(next, state.snakeState)
  if (state?.webState?.dirtyKeys?.length) next = applyWebDesignStateToCode(next, state.webState)
  return next
}
