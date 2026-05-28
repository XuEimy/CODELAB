# CODELAB 工作台窗口 PRD v2

> Version 2.0 | 2026-03-29
> 适用范围：`app.html` 工作台全部浮动窗口

---

## 一、产品主线

工作台的信息流主线：

> **认领任务 → 理解任务 → 执行任务 → 验证结果 → 同步给团队**

每个窗口必须能回答：它在这条链上的哪个环节。

---

## 二、窗口总表（16 个）

### 删除的窗口（从 18 → 16）
| 原窗口 | 去向 |
|---|---|
| `tasks` 任务清单 | 并入 `design-graph` 智慧树 |
| `task-list-agent` Agent 任务 | 并入 `design-graph` 智慧树 |
| `design` 设计工具 | 功能分散到 design-tree/design-vibe/web-design |
| `mockup` 游戏样机 | 并入 `web-design` 设计预览 |

### 新增的窗口（+2）
| 新窗口 | 用途 |
|---|---|
| `diff` 变更预览 | 实时代码 diff + 协作者修改高亮 |
| `console` 运行日志 | iframe 日志捕获 + 报错定位 |

### 最终 16 窗口

| # | ID | 名称 | 主色 | 主线环节 | 所属模式 |
|---|---|---|---|---|---|
| 1 | `task-info` | 任务驾驶舱 | gold | 理解+追踪 | 全局(pw-*) |
| 2 | `personal-ws` | 我的仪表盘 | accent2 | 理解+同步 | 全局(pw-*) |
| 3 | `ai` | AI 助手 | purple | 执行 | chat/task/pw-* |
| 4 | `chat` | 团队聊天 | green | 同步 | chat |
| 5 | `activity` | 系统事件流 | gold | 同步 | chat |
| 6 | `stats` | 玩家统计 | accent | 同步 | chat |
| 7 | `editor` | 代码编辑器 | purple | 执行 | dev |
| 8 | `preview` | 游戏预览 | green | 验证 | dev/design/task |
| 9 | `codemap` | 代码地图 | green | 执行 | dev |
| 10 | `diff` | 变更预览 | accent | 验证 | dev |
| 11 | `console` | 运行日志 | orange | 验证 | dev |
| 12 | `design-tree` | 游戏概览 | green | 理解 | design |
| 13 | `design-graph` | 智慧树 | accent | 理解+执行 | design/task |
| 14 | `design-vibe` | 设计 Agent | pink | 执行 | design |
| 15 | `web-design` | 设计预览 | orange | 验证 | design/game |
| 16 | `task-prompt` | 任务提示词 | orange | 执行 | task |

---

## 三、模式-窗口映射

```javascript
const WIN_DEFS = [
  {id:'task-info',   name:'任务驾驶舱', icon:'i-clipboard', color:'var(--gold)',    w:300, h:400},
  {id:'personal-ws', name:'我的仪表盘', icon:'i-users',     color:'var(--accent2)', w:240, h:400},
  {id:'ai',          name:'AI 助手',    icon:'i-sparkles',  color:'var(--purple)',  w:320, h:400},
  {id:'chat',        name:'团队聊天',   icon:'i-chat',      color:'var(--green)',   w:320, h:400},
  {id:'activity',    name:'系统事件流', icon:'i-zap',       color:'var(--gold)',    w:280, h:280},
  {id:'stats',       name:'玩家统计',   icon:'i-bar-chart', color:'var(--accent)',  w:300, h:360},
  {id:'editor',      name:'代码编辑器', icon:'i-code',      color:'var(--purple)',  w:500, h:400},
  {id:'preview',     name:'游戏预览',   icon:'i-gamepad',   color:'var(--green)',   w:500, h:400},
  {id:'codemap',     name:'代码地图',   icon:'i-map',       color:'var(--green)',   w:180, h:300},
  {id:'diff',        name:'变更预览',   icon:'i-code',      color:'var(--accent)',  w:400, h:350},
  {id:'console',     name:'运行日志',   icon:'i-zap',       color:'var(--orange)',  w:400, h:250},
  {id:'design-tree', name:'游戏概览',   icon:'i-map',       color:'var(--green)',   w:300, h:400},
  {id:'design-graph',name:'智慧树',     icon:'i-grid',      color:'var(--accent)',  w:620, h:460},
  {id:'design-vibe', name:'设计 Agent', icon:'i-sparkles',  color:'var(--pink)',    w:320, h:400},
  {id:'web-design',  name:'设计预览',   icon:'i-monitor',   color:'var(--orange)',  w:500, h:400},
  {id:'task-prompt', name:'任务提示词', icon:'i-clipboard', color:'var(--orange)',  w:300, h:320},
]

const MODE_WINS = {
  dev:    ['editor', 'preview', 'codemap', 'diff', 'console'],
  design: ['design-tree', 'design-graph', 'design-vibe', 'web-design', 'preview'],
  chat:   ['chat', 'activity', 'stats', 'ai'],
  game:   ['web-design', 'preview'],
  task:   ['design-graph', 'task-prompt', 'ai', 'preview'],
}

// 个人工作台模式 (pw-*) 分类预设
function getCategoryPresetWins(catLabel) {
  code:    ['personal-ws','task-info','editor','preview','codemap','diff','console']
  design:  ['personal-ws','task-info','design-vibe','web-design','preview']
  system:  ['personal-ws','task-info','design-tree','design-graph','ai']
  scene:   ['personal-ws','task-info','design-graph','preview','ai']
  story:   ['personal-ws','task-info','ai','chat','preview']
  default: ['personal-ws','task-info','ai','preview']
}
```

---

## 四、各窗口详细规格

---

### W01 — 任务驾驶舱 (`task-info`)

**产品定位**：工作流中枢。不是被动的信息面板，而是主动引导用户的导航器。

**信息流环节**：理解任务 + 追踪进度

**结构**：
```
┌─────────────────────────────────────┐
│ 任务驾驶舱                    ● 进行中│
├─────────────────────────────────────┤
│                                     │
│  碰撞检测优化                       │
│  ┌─────────────────────────────┐   │
│  │ 系统 · 战斗机制              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ── 工作流进度 ──                   │
│  ◉ 理解需求 → ◉ 编写代码 →        │
│  ○ 预览测试 → ○ 提交验收           │
│                                     │
│  ── 任务描述 ──                     │
│  优化贪吃蛇碰撞检测逻辑，修复     │
│  边界穿透 bug...                    │
│                                     │
│  ── 关联节点 ──                     │
│  ● 碰撞检测    进行中              │
│  ● 物理引擎    已完成              │
│  ● 边界处理    待办                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        提交验收               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**步骤条自动推进逻辑**：
- 进入工作台 → "理解需求" 激活
- 编辑器产生第一次编辑 → "编写代码" 激活
- 点击"运行游戏" → "预览测试" 激活
- 点击"提交验收" → 打包代码 + 生成 diff 摘要 + 推送通知 + 智慧树标记完成

**提交验收功能**：
- 自动打包当前代码状态（bundled HTML）
- 生成 diff 摘要（改了哪些文件、多少行）
- 通过 Yjs 广播通知给团队
- 在智慧树对应节点标记为"已完成"

**数据来源**：
- URL 参数 `?task=xxx&cat=xxx`
- Yjs `plan_tree` / `agent_tasks`
- 本地编辑器事件（步骤条推进）

**空状态**：虚线边框的步骤条骨架 + "选择一个任务节点开始"

**视觉规范**：
- 步骤条：水平 flex，每个步骤 `24px` 圆点 + 连线
- 激活步骤：`background: var(--gold)`, `color: #fff`
- 未激活步骤：`background: var(--bg3)`, `color: var(--textd)`
- 连线：`height: 2px`, `background: var(--border)`, 激活后 `var(--gold)`
- 任务标题：`font-family: var(--font-head)`, `font-size: 16px`, `font-weight: 700`
- 分类 badge：`border-radius: 999px`, `padding: 3px 10px`, `font-size: 9px`
- 关联节点列表：每行 `padding: 8px 10px`, `border-radius: 12px`
- 提交按钮：`background: var(--green)`, `color: #020a06`, `border-radius: var(--radius-sm)`, `height: 36px`, `font-weight: 700`

---

### W02 — 我的仪表盘 (`personal-ws`)

**产品定位**："我的视角" — 个人任务、贡献、笔记的集中面板。不再是团队名单。

**信息流环节**：理解（我领了什么）+ 同步（我贡献了什么）

**结构**：
```
┌─────────────────────────────────────┐
│ MY DASHBOARD              ● 在线    │
├─────────────────────────────────────┤
│                                     │
│  ┌──┐ 玩家名                       │
│  │😊│ 已认领 3 个任务               │
│  └──┘                               │
│                                     │
│  ── 我的任务 ──                     │
│  ┌─────────────────────────────┐   │
│  │ ● 碰撞检测        进行中 ←当前 │   │
│  ├─────────────────────────────┤   │
│  │ ○ UI 美化          待办       │   │
│  ├─────────────────────────────┤   │
│  │ ✓ 基础移动         已完成     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ── 今日贡献 ──                     │
│  代码 127 行 · AI 对话 8 次         │
│  预览 5 次 · 在线 2h 14m            │
│                                     │
├─────────────────────────────────────┤
│ [个人笔记...]                       │
└─────────────────────────────────────┘
```

**任务快捷切换**：
- 点击任务行 → 切换 `task-info` 到该任务 → 编辑器跳转到相关代码
- 当前任务有 `←当前` 标记 + accent 高亮

**今日贡献数据**：
- 代码行数：监听编辑器 change 事件累计
- AI 对话次数：`aiMessageStores` 计数
- 预览次数：运行按钮点击计数
- 在线时长：进入时间 → now

**空状态**（未认领任务时）：
```
┌──┐
│😊│ 你是第一个到达的人
└──┘ ● 在线

还没有认领任务
前往智慧树认领第一个任务 →
```

**视觉规范**：
- 头像：`width: 36px`, `height: 36px`, `border-radius: 50%`, `border: 2px solid var(--accent)`
- 任务列表：`border: 1px solid var(--border)`, `border-radius: 12px`, 每行 `padding: 10px 12px`
- 当前任务行：`background: var(--accent-bg)`, `border-left: 3px solid var(--accent)`
- 贡献统计：行内排列，`font-family: var(--font-code)`, `font-size: 10px`
- 数字高亮：`color: var(--accent)`, `font-weight: 700`

---

### W03 — AI 助手 (`ai`)

**产品定位**：上下文感知的 AI 对话助手。根据用户当前焦点窗口自动调整角色。

**信息流环节**：执行

**改动**：保留现有聊天 + 新增推荐提示词栏 + 上下文感知

**结构**：
```
┌─────────────────────────────────────┐
│ AI 助手                 ● 代码模式   │
├─────────────────────────────────────┤
│ [加排行榜] [双人对战] [换主题] [加道具]│ ← 推荐提示词
├─────────────────────────────────────┤
│                                     │
│  消息区域...                        │
│                                     │
├─────────────────────────────────────┤
│ [输入框]                    [发送]   │
└─────────────────────────────────────┘
```

**推荐提示词栏**：
- 位置：消息区上方，固定横条
- 样式：水平滚动 flex，`gap: 6px`，`overflow-x: auto`
- 每个 pill：`border-radius: 999px`, `padding: 4px 12px`, `border: 1px solid var(--border)`, `font-size: 10px`
- 点击 → 文字填入输入框 → 自动发送
- 来源：基于游戏类型的静态建议 + 从当前任务描述提取的动作

**上下文感知**：
- 追踪 `lastFocusedWin` 变量（窗口 mousedown 事件更新）
- AI system prompt 动态注入：
  - 焦点在 editor → "用户正在编辑代码，优先回答代码问题"
  - 焦点在 design-vibe → "用户正在做设计，优先回答设计问题"
  - 焦点在 design-graph → "用户正在查看任务树，优先帮助拆解任务"
- 窗口标题栏右侧显示当前模式标签：`● 代码模式` / `● 设计模式` / `● 任务模式`

**视觉规范**：
- 提示词栏：`height: 36px`, `background: var(--bg2)`, `border-bottom: 1px solid var(--border)`, `padding: 0 10px`
- 提示词 pill hover：`border-color: var(--purple)`, `color: var(--purple)`, `background: var(--purple-bg)`
- 模式标签：`font-size: 8px`, `padding: 2px 8px`, `border-radius: 999px`

---

### W04 — 团队聊天 (`chat`)

**产品定位**：纯人类对话频道。不混入系统事件。与规划台讨论完全一致。

**信息流环节**：同步

**完整复制 plan.html ChatPanel**，转写为原生 JS：

**结构**：
```
┌─────────────────────────────────────┐
│ ● 12 条消息              ↻ 同步中   │
├─────────────────────────────────────┤
│                                     │
│ [头像] 玩家名            10:23      │
│ ┌─────────────────────┐             │
│ │ 消息内容              │             │
│ └─────────────────────┘             │
│                                     │
│ [✨] 主持 AI            10:24      │
│ ┌─────────────────────┐             │
│ │ AI 回复（紫色气泡）   │             │
│ └─────────────────────┘             │
│                                     │
├─────────────────────────────────────┤
│ [输入框 Shift+Enter换行]    [发送]  │
│ [表情] [@ 成员] [@AI] [AI 整理]     │
└─────────────────────────────────────┘
```

**完整功能清单**：
1. 消息列表：玩家灰色气泡 + AI 紫色气泡
2. 输入框：Shift+Enter 换行，Enter 发送，自动展开（max 100px）
3. 表情选择器：20 个表情的 4 列 popup grid
4. @提及：用户列表 popup + @AI 快捷按钮
5. AI 整理：调用 `callAI()` 分析聊天内容生成摘要
6. 打字指示器：三点跳动动画
7. 流式 AI 回复：SSE 实时渲染

**数据同步**：Yjs `yChat` 数组（与 plan.html 共享同一 room）

**视觉规范**（直接复用 plan.html CSS）：
- 聊天头部：`height: 36px`, `background: var(--bg2)`
- 玩家气泡：`background: var(--bg2)`, `border: 1px solid var(--border)`, `border-radius: 12px`
- AI 气泡：`background: var(--purple-bg)`, `border: 1px solid rgba(167,139,250,.15)`, `border-radius: 12px`
- AI 头像：`background: linear-gradient(135deg, #7c3aed, #6366f1)`, `color: #fff`
- 输入框：`border-radius: 12px`, `border: 1px solid var(--border)`, focus 时 `border-color: var(--green)`, `box-shadow: 0 0 0 3px var(--green-bg)`
- 发送按钮：`border: 1px solid var(--green)`, `background: var(--green-bg)`, `color: var(--green)`, hover 时填充
- 工具栏按钮：`border-radius: 999px`, `height: 28px`, `padding: 0 10px`, `font-size: 10px`
- AI 整理按钮特殊色：`border-color: var(--purple)`, `color: var(--purple)`

---

### W05 — 系统事件流 (`activity`)

**产品定位**：纯系统自动化事件。不混入人类消息。与 chat 完全互斥。

**信息流环节**：同步

**保持现有方向 + 补充内容**：

**事件类型**：
| 事件 | 图标 | 颜色 | 文案模板 |
|---|---|---|---|
| 进入工作台 | `i-users` | green | `{name} 进入了工作台` |
| 离开工作台 | `i-users` | textd | `{name} 离开了工作台` |
| 编辑代码 | `i-code` | purple | `{name} 编辑了 {file}` |
| 运行预览 | `i-gamepad` | green | `{name} 运行了游戏预览` |
| 设计变更 | `i-brush` | pink | `{name} 应用了设计变更` |
| AI 请求 | `i-sparkles` | purple | `{name} 向 AI 提问` |
| 任务状态 | `i-clipboard` | gold | `{name} 将 {task} 标记为已完成` |

**初始事件**：进入工作台时自动插入 "[用户名] 进入了工作台"

**视觉规范**：
- 每条事件：`display: flex`, `gap: 8px`, `padding: 8px 10px`, `border-radius: 10px`
- 图标圆点：`width: 24px`, `height: 24px`, `border-radius: 50%`, `background: var(--xxx-bg)`
- 时间戳：`font-family: var(--font-code)`, `font-size: 9px`, `color: var(--textd)`, 靠右
- 事件文本：`font-size: 11px`, `color: var(--textm)`
- 用户名高亮：`color: var(--text)`, `font-weight: 600`

**空状态**：脉冲圆点 + "等待第一次协作事件..."

---

### W06 — 玩家统计 (`stats`)

**产品定位**：团队协作数据和贡献排行。

**信息流环节**：同步

**视觉全部重做**：

**结构**：
```
┌─────────────────────────────────────┐
│ PLAYER STATS                        │
├─────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐      │
│ │     3       │ │    127     │      │
│ │  在线协作者  │ │  代码行数   │      │
│ └────────────┘ └────────────┘      │
│ ┌────────────┐ ┌────────────┐      │
│ │     8       │ │     5      │      │
│ │  AI 对话    │ │  预览运行   │      │
│ └────────────┘ └────────────┘      │
│                                     │
│ ── 贡献排行 ──                      │
│ 1  玩家A  ▓▓▓▓▓▓▓▓░░  342         │
│ 2  玩家B  ▓▓▓▓▓░░░░░  218         │
│ 3  玩家C  ▓▓▓░░░░░░░  156         │
│                                     │
│ ── 在线时长 ──                      │
│ ▓▓▓▓▓▓▓▓░░ 2h 14m                 │
└─────────────────────────────────────┘
```

**视觉规范**：
- 统计卡片网格：`display: grid`, `grid-template-columns: 1fr 1fr`, `gap: 8px`, `padding: 10px`
- 每个统计卡：`border-radius: 14px`, `background: var(--bg2)`, `border: 1px solid var(--border)`, `padding: 14px`, `text-align: center`
- 数字：`font-family: var(--font-code)`, `font-size: 28px`, `font-weight: 800`
- 数字颜色：在线=`var(--green)`, 代码=`var(--purple)`, AI=`var(--accent)`, 预览=`var(--orange)`
- 标签：`font-size: 10px`, `color: var(--textd)`, `letter-spacing: 1px`, `margin-top: 4px`
- 排行条：`height: 6px`, `border-radius: 999px`, `background: var(--bg3)`, 填充渐变 `linear-gradient(90deg, var(--accent), var(--green))`
- 排行名次：`width: 20px`, `font-weight: 800`, `color: var(--gold)` (前3)
- Section 标题：`font-family: var(--font-code)`, `font-size: 9px`, `letter-spacing: 1.5px`, `color: var(--textd)`, `text-transform: uppercase`

**空状态**：骨架卡片 + 数字用 `--` + "开始协作后数据将自动更新"

---

### W07 — 代码编辑器 (`editor`)

**保持现状**。已有完整实现。

---

### W08 — 游戏预览 (`preview`)

**保持现状**。idle 显示手柄图标 + "点击运行游戏启动"。

---

### W09 — 代码地图 (`codemap`)

**保持现状**。canvas 缩略图。

---

### W10 — 变更预览 (`diff`) 🆕

**产品定位**：实时代码变更视图。解决"我改了什么"和"队友改了什么"的问题。

**信息流环节**：验证

**结构**：
```
┌─────────────────────────────────────────┐
│ DIFF                [unified] [split]   │
├─────────────────────────────────────────┤
│                                         │
│  index.html  +12 -3                     │
│  ─────────────────────────────────      │
│  42 │   function checkCollision() {     │
│  43 │ - if (x < 0) return true;         │ (红色背景)
│  44 │ + if (x < 0 || x >= W) {          │ (绿色背景)
│  45 │ +   return true;                  │ (绿色背景)
│  46 │ + }                               │ (绿色背景)
│  47 │   }                               │
│     │                                   │
│  68 │ + // 新增边界检测                  │ (蓝色背景=队友)
│  69 │ + function boundaryCheck() {      │ (蓝色背景=队友)
│                                         │
├─────────────────────────────────────────┤
│ +15 行  -3 行  2 个文件  上次运行后变更  │
└─────────────────────────────────────────┘
```

**功能**：
1. **Unified/Split 视图切换**：默认 unified，pill 按钮切换
2. **变更基准**：上次点击"运行游戏"时的代码快照 vs 当前代码
3. **协作者颜色标记**：自己的修改=标准绿/红，队友修改=用队友的主题色背景
4. **文件分组**：按文件名分组显示，每个文件头显示 `+N -M`
5. **统计栏**：底部固定，显示总增删行数和文件数

**Diff 算法**：使用简易行级 diff（逐行比对即可，不需要完整 Myers）

**数据来源**：
- 基准代码：每次 `runGame()` 时保存 `lastRunCode = getCurrentBundledCode()`
- 当前代码：实时从 `getCurrentBundledCode()` 获取
- 协作者信息：Yjs awareness 的 `user.name` + `user.color`

**视觉规范**：
- 代码字体：`font-family: var(--font-code)`, `font-size: 11px`, `line-height: 18px`
- 行号：`width: 36px`, `color: var(--textd)`, `text-align: right`, `padding-right: 8px`
- 增行背景：`rgba(74,222,128,.08)`, 左边线 `3px solid var(--green)`
- 删行背景：`rgba(251,113,133,.08)`, 左边线 `3px solid var(--pink)`
- 队友修改背景：`rgba(96,165,250,.08)`, 左边线 `3px solid var(--accent)`
- 文件头：`background: var(--bg3)`, `padding: 6px 10px`, `font-weight: 600`, `border-radius: 8px`
- 统计栏：`height: 28px`, `background: var(--bg2)`, `font-size: 10px`, `border-top: 1px solid var(--border)`

**空状态**："运行游戏后，代码变更将在这里显示"

---

### W11 — 运行日志 (`console`) 🆕

**产品定位**：捕获 iframe 内的 console 输出。完成编辑→运行→调试闭环。

**信息流环节**：验证

**结构**：
```
┌─────────────────────────────────────────┐
│ CONSOLE           [clear] [filter ▼]    │
├─────────────────────────────────────────┤
│                                         │
│ 10:23:01  LOG   游戏初始化完成           │
│ 10:23:02  LOG   加载资源: 12 items       │
│ 10:23:05  WARN  Canvas 尺寸超出视口      │
│ 10:23:08  ERR   Uncaught TypeError:      │
│                  Cannot read property    │
│                  'x' of undefined        │
│                  → index.html:42  [跳转] │
│                                         │
│ 10:23:08  AI    检测到错误，建议修复：    │
│                  在 checkCollision 中     │
│                  添加 null 检查           │
│                  [一键修复]              │
│                                         │
├─────────────────────────────────────────┤
│ 6 条日志  1 警告  1 错误                │
└─────────────────────────────────────────┘
```

**功能**：
1. **日志捕获**：通过 iframe `postMessage` 通信捕获 console.log/warn/error
2. **级别筛选**：filter 下拉可选 ALL/LOG/WARN/ERR
3. **清除按钮**：清空当前日志列表
4. **错误跳转**：解析 error stack 的行号，点击 `[跳转]` → 编辑器定位到对应行
5. **AI 自动修复建议**：检测到 error 时，自动调用 AI 分析错误并给出修复建议，显示 `[一键修复]` 按钮
6. **统计栏**：底部固定，显示各级别计数

**iframe 通信方案**：
在注入游戏代码前，自动在 `<head>` 中插入 console 拦截脚本：
```javascript
// 注入到 iframe 的拦截代码
(function(){
  ['log','warn','error'].forEach(function(level){
    var orig = console[level];
    console[level] = function(){
      orig.apply(console, arguments);
      parent.postMessage({
        type: 'console',
        level: level,
        args: Array.from(arguments).map(String),
        ts: Date.now()
      }, '*');
    };
  });
  window.onerror = function(msg, src, line, col) {
    parent.postMessage({
      type: 'console',
      level: 'error',
      args: [msg + ' at ' + src + ':' + line + ':' + col],
      ts: Date.now()
    }, '*');
  };
})();
```

**视觉规范**：
- 日志行：`display: flex`, `gap: 8px`, `padding: 4px 10px`, `font-family: var(--font-code)`, `font-size: 10px`
- 时间戳：`color: var(--textd)`, `flex-shrink: 0`, `width: 60px`
- LOG 级别标签：`color: var(--textm)`
- WARN 级别标签：`color: var(--gold)`, 整行 `background: var(--gold-bg)`
- ERR 级别标签：`color: var(--pink)`, 整行 `background: var(--pink-bg)`
- AI 建议行：`background: var(--purple-bg)`, `border-left: 3px solid var(--purple)`, `padding: 8px 10px`, `border-radius: 8px`
- 跳转链接：`color: var(--accent)`, `cursor: pointer`, `text-decoration: underline`
- 一键修复按钮：`background: var(--purple)`, `color: #fff`, `border-radius: 999px`, `padding: 3px 10px`, `font-size: 9px`
- 统计栏：同 diff 窗口底部样式

**空状态**："运行游戏后，控制台输出将在这里显示"

---

### W12 — 游戏概览 (`design-tree`)

**保持现有 `renderDesignTreeWindow` 实现**。

已有：游戏概念摘要、实时状态、变更历史、任务规划进度。

---

### W13 — 智慧树 (`design-graph`)

**产品定位**：可视化任务/结构树 + AI 智能整理。合并 tasks + task-list-agent + design-graph。

**信息流环节**：理解 + 执行

**结构**：
```
┌─────────────────────────────────────────────┐
│ 智慧树           [我的任务|全局] [AI 整理]  │
├─────────────────────────────────────────────┤
│                                              │
│         ┌──────────┐                        │
│         │ 贪吃蛇游戏 │                       │
│         └────┬─────┘                        │
│       ┌──────┼──────┐                       │
│    ┌──┴──┐┌──┴──┐┌──┴──┐                   │
│    │碰撞  ││ UI  ││移动  │                   │
│    │进行中 ││待办  ││已完成│                   │
│    └─────┘└─────┘└─────┘                    │
│                                              │
│  ── 共识摘要 ──                              │
│  ✓ 基础玩法：经典贪吃蛇                      │
│  → 下一步：加入道具系统                       │
│                                              │
│  ── 待确认 ──                                │
│  ? 碰撞检测用矩形还是圆形？                   │
│  ⚠ 双人模式的网络延迟方案存在分歧             │
└─────────────────────────────────────────────┘
```

**视图切换**：
- **我的任务**：只展示当前用户认领的节点及子节点
- **全局**：展示完整游戏结构树

**AI 整理**：
- 调用 `callAI()` 分析上下文
- 返回与 plan.html `SummaryPanel` 相同格式的 JSON
- 结果渲染在树下方

**节点 → 编辑器联动**：
- 点击节点 → 如果该节点有关联代码位置 → 编辑器跳转到对应行
- 关联映射在 AI 整理时自动生成

**视觉规范**：
- 根节点 pill：`border-radius: 999px`, `border: 1px solid var(--accent)`, `background: var(--accent-bg)`, `color: var(--accent)`
- 子节点卡片：`width: 152px`, `padding: 9px`, `border-radius: 14px`, `border: 1px solid var(--border)`
- 节点状态色：待办=`var(--textd)`, 进行中=`var(--accent)`, 已完成=`var(--green)`
- 连线：SVG `stroke: var(--border)`, `stroke-width: 1.8`
- 共识卡片：`background: var(--bg2)`, `border-radius: 12px`, `padding: 10px`
- 问题/冲突：`border-left: 3px solid var(--orange)` / `var(--pink)`

---

### W14 — 设计 Agent (`design-vibe`)

**产品定位**：专业设计 AI 聊天助手，内置 UI/UX Skill。对话结果可生成设计卡片。

**信息流环节**：执行

**结构**：
```
┌─────────────────────────────────────┐
│ DESIGN AGENT          ● 设计模式    │
├─────────────────────────────────────┤
│                                     │
│ [✨] Design Agent                   │
│ ┌─────────────────────┐            │
│ │ 我是你的设计助手       │            │
│ │ • 配色方案 • UI 布局   │            │
│ │ • 动效设计 • 字体搭配  │            │
│ └─────────────────────┘            │
│                                     │
│ ── 设计卡片 ──                      │
│ ┌───────────────────┐              │
│ │ 🎨 春意配色方案     │              │
│ │ #4ade80 #60a5fa    │              │
│ │ [应用到游戏] [Pin]  │              │
│ └───────────────────┘              │
│                                     │
├─────────────────────────────────────┤
│ [输入设计需求...]           [发送]   │
│ [配色] [布局] [动效] [字体] [Vibe]  │
└─────────────────────────────────────┘
```

**设计卡片产出物**：
- AI 回复中检测到设计方案时，自动提取为"设计卡片"
- 每张卡片有：标题、色值/参数、预览
- 操作按钮：
  - `[应用到游戏]`：生成 CSS 代码注入编辑器
  - `[Pin]`：固定到智慧树对应节点

**AI System Prompt**：
```
你是 CODELAB 的专业游戏 UI/UX 设计 Agent。你擅长：
1. 色彩理论与游戏主题配色方案
2. 游戏界面布局与信息层级
3. CSS 动画与微交互设计
4. 字体搭配与排版节奏
5. Vibe 风格定义（春意/危险/柔和/机械/赛博等）

当用户描述设计需求时：
- 给出具体的 CSS 代码
- 使用 JSON 格式输出设计参数（用 ```design 代码块包裹）
- 包含色值、间距、圆角、阴影等可直接应用的 token

当前游戏代码：{currentCode}
当前 schema：{schemaId}
```

**Skill 快捷按钮**：
- 配色：插入 "请为当前游戏设计一套配色方案"
- 布局：插入 "请优化当前游戏的 UI 布局"
- 动效：插入 "请建议适合的 CSS 动画效果"
- 字体：插入 "请推荐适合的字体搭配"
- Vibe：插入 "请给出 3 个不同的 vibe 设计方向"

**视觉规范**：
- 聊天 UI：复用 AI 助手的消息样式，但 AI 头像用 `background: linear-gradient(135deg, #ec4899, #f43f5e)`（粉色系）
- 设计卡片：`border-radius: 14px`, `border: 1px solid var(--pink)`, `background: var(--pink-bg)`, `padding: 12px`
- 色值展示：内联圆形色块 `width: 20px`, `height: 20px`, `border-radius: 50%`, `display: inline-block`
- 应用按钮：`background: var(--pink)`, `color: #fff`, `border-radius: 999px`
- Pin 按钮：`border: 1px solid var(--border)`, `background: transparent`

---

### W15 — 设计预览 (`web-design`)

**产品定位**：合并 Web Design 令牌 + 游戏样机。双模式切换。

**信息流环节**：验证

**结构**：
```
┌─────────────────────────────────────────────┐
│ 设计预览        [Web 令牌 | 游戏样机]        │
├─────────────────────────────────────────────┤
│                                              │
│  === Tab 1: Web 令牌 ===                     │
│  (保留现有 renderWebDesignWindow)            │
│                                              │
│  === Tab 2: 游戏样机 ===                     │
│  [🖥 现代] [📺 复古] [🎮 街机] [🎮 掌机]    │
│  ┌─────────────────────────────┐            │
│  │    ┌───────────────┐        │            │
│  │    │               │        │            │
│  │    │  游戏 iframe   │        │            │
│  │    │               │        │            │
│  │    └───────────────┘        │            │
│  └─────────────────────────────┘            │
│                                              │
└─────────────────────────────────────────────┘
```

**Tab 切换**：窗口 body 顶部 pill 切换，默认 Web 令牌模式

**视觉规范**：
- Tab 栏：`display: flex`, `gap: 2px`, `padding: 6px 8px`, `background: var(--bg2)`, `border-bottom: 1px solid var(--border)`
- Tab pill：`border-radius: 999px`, `padding: 4px 12px`, `font-size: 10px`
- Active tab：`background: var(--orange)`, `color: #fff`
- 样机容器：保留现有 `.mockup-container` 全部样式

---

### W16 — 任务提示词 (`task-prompt`)

**保持现状** + 两个小优化：

1. **自动加载**：从 `task-info` 的当前任务描述自动生成初始 prompt
2. **变量高亮**：`{{变量名}}` 以 `color: var(--accent)`, `background: var(--accent-bg)`, `border-radius: 4px`, `padding: 0 4px` 显示

---

## 五、窗口联动机制

### 联动 A：智慧树 → 编辑器
- 点击智慧树节点 → 编辑器跳转到对应代码段
- 需要 AI 在整理时生成 `nodeId → lineNumber` 映射

### 联动 B：AI 助手 → 上下文感知
- 追踪 `lastFocusedWin`（mousedown 事件更新）
- AI system prompt 动态注入焦点窗口信息

### 联动 C：预览 → 控制台
- 游戏运行时 iframe postMessage → console 窗口实时更新

### 联动 D：控制台 → 编辑器
- 点击错误行号 → 编辑器 `scrollToLine()` 跳转

### 联动 E：任务驾驶舱 → 全局
- 步骤条根据编辑器/预览/提交事件自动推进
- 提交验收 → 智慧树节点标记完成 → activity 广播事件

### 联动 F：我的仪表盘 → 任务驾驶舱
- 点击任务列表行 → 切换 task-info 到该任务

---

## 六、视觉规范（全局）

所有窗口遵循 design-system-preview.html 定义的规范：

### 颜色系统
```css
/* 暗色主题 */
--bg:#0f1117; --bg2:#161920; --bg3:#1c2029; --bg4:#252932;
--text:#e2e8f0; --textm:#94a3b8; --textd:#64748b;
--accent:#60a5fa; --accent2:#818cf8;
--green:#4ade80; --pink:#fb7185; --gold:#fbbf24; --orange:#fb923c; --purple:#a78bfa;
--border:rgba(255,255,255,.08); --border-h:rgba(255,255,255,.14);

/* 语义背景 */
--accent-bg:rgba(96,165,250,.08);
--green-bg:rgba(74,222,128,.08);
--pink-bg:rgba(251,113,133,.08);
--gold-bg:rgba(251,191,36,.08);
--purple-bg:rgba(167,139,250,.08);
```

### 字体
```css
--font-head:'Space Grotesk','Noto Sans SC',system-ui,sans-serif;
--font-ui:'Inter','Noto Sans SC',system-ui,sans-serif;
--font-code:'JetBrains Mono','SF Mono','Fira Code',monospace;
```

### 尺寸阶梯
```
字体: 9px → 10px → 11px → 12px → 13px → 14px → 16px → 24px → 28px
间距: 4px → 6px → 8px → 10px → 12px → 14px → 16px → 18px → 20px
圆角: 4px → 8px → 10px → 12px → 14px → 16px → 20px → 999px
```

### 组件规范
- **窗口栏**：`height: 34px`, `background: var(--bg3)`, `border-bottom: 1px solid var(--border)`
- **窗口体**：`background: var(--bg)` 或 `var(--bg2)`
- **卡片**：`border-radius: 12-14px`, `border: 1px solid var(--border)`, `background: var(--bg2)`
- **Pills**：`border-radius: 999px`, `padding: 4-6px 10-14px`, `font-size: 10px`, `font-family: var(--font-code)`
- **输入框**：`border-radius: 8-12px`, `border: 1px solid var(--border)`, focus 时 `border-color: var(--accent2)` + `box-shadow: 0 0 0 3px var(--accent-bg)`
- **空状态**：居中 flex-column, 40px 图标 + 10px 文字 + 可选脉冲动画

---

## 七、实施拆分

### Agent 1: 团队聊天 (`chat`)
- 将 plan.html ChatPanel 转写为原生 JS
- 实现完整聊天功能
- 接入 Yjs yChat

### Agent 2: 玩家统计 (`stats`)
- 全新 renderPlayerStatsWindow
- 2x2 统计卡 + 排行榜 + 进度条

### Agent 3: 智慧树 (`design-graph`)
- 合并 tasks + task-list-agent
- 我的任务/全局 双视图
- 接入 AI 整理
- 共识摘要区域

### Agent 4: AI 助手 (`ai`) + 设计 Agent (`design-vibe`)
- AI 推荐提示词栏
- 上下文感知 system prompt
- 设计 Agent 聊天 + Skill 按钮 + 设计卡片

### Agent 5: 新窗口 (`diff` + `console`) + 设计预览 (`web-design`)
- diff 窗口完整实现
- console 窗口 + iframe postMessage 拦截
- web-design 合并样机 tab

### Agent 6: 驾驶舱 + 仪表盘 + 事件流 + 清理
- task-info 升级为驾驶舱（步骤条 + 提交验收）
- personal-ws 改为仪表盘（任务列表 + 贡献统计）
- activity 补充事件类型
- 删除 tasks/design/mockup/task-list-agent
- 更新 WIN_DEFS / MODE_WINS / getCategoryPresetWins
