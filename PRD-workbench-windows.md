# CODELAB 工作台窗口内容 PRD

> Version 1.0 | 2026-03-29
> 适用范围：`app.html` 工作台的全部浮动窗口

---

## 一、背景与目标

用户从规划台（plan.html）认领任务后进入工作台（app.html）。当前工作台有 18 个窗口定义，但多数窗口在进入时内容为空或仅有占位文字。本 PRD 定义每个窗口的**内容规格、交互行为、数据来源**，目标是：

1. 用户进入工作台后，**零操作即可看到有意义的内容**
2. 每个窗口有**明确的产品职责**，不重叠
3. 所有窗口遵循统一的**视觉规范**

---

## 二、窗口合并与删减决策

### 删除的窗口
| 原窗口 | 原因 |
|---|---|
| `tasks`（任务清单） | 功能被 `design-graph`（可视化树状图）吸收 |
| `design`（设计工具） | 功能分散到 design-tree / design-vibe / web-design |

### 合并的窗口
| 合并结果 | 来源 | 说明 |
|---|---|---|
| `design-graph` 智慧树 | `tasks` + `design-graph` | 既是任务树也是可视化结构图，接入 AI 整理 |
| `web-design` 设计预览 | `web-design` + `mockup` | Web Design 与游戏样机合并为统一的"设计预览"窗口 |

### 最终窗口列表（14 个）

| # | ID | 名称 | 主色 | 所属模式 |
|---|---|---|---|---|
| 1 | `personal-ws` | 个人工作台 | accent2 | 全局 |
| 2 | `task-info` | 任务面板 | gold | 全局 |
| 3 | `ai` | AI 助手 | purple | chat / task |
| 4 | `preview` | 游戏预览 | green | dev / design / task |
| 5 | `editor` | 代码编辑器 | purple | dev |
| 6 | `codemap` | 代码地图 | green | dev |
| 7 | `chat` | 团队聊天 | green | chat |
| 8 | `activity` | 协作战况 | gold | chat |
| 9 | `stats` | 玩家统计 | accent | chat |
| 10 | `design-tree` | 游戏概览 | green | design |
| 11 | `design-graph` | 智慧树 | accent | design / task |
| 12 | `design-vibe` | 设计 Agent | pink | design |
| 13 | `web-design` | 设计预览 | orange | design / game |
| 14 | `task-prompt` | 任务提示词 | orange | task |

> `task-list-agent` 合并进 `design-graph` 智慧树，不再单独存在。

---

## 三、各窗口详细规格

---

### 1. AI 助手 (`ai`)

**定位**：通用 AI 对话助手，辅助编码、设计、问答。

**保留现有内容**：欢迎消息 + 对话框。

**新增 — 推荐提示词栏**：
- 位置：聊天消息区上方，输入框上方的固定横条
- 结构：水平滚动的 pill 按钮列表
- 内容根据当前任务上下文动态生成：

```
┌─────────────────────────────────────────────┐
│ [推荐]                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 加排行榜  │ │ 双人对战  │ │ 换主题    │      │
│ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────┤
│ 消息区域...                                   │
│                                               │
├─────────────────────────────────────────────┤
│ [输入框]                          [发送]      │
└─────────────────────────────────────────────┘
```

**提示词来源**：
- 默认提示词：基于游戏类型的通用建议（如贪吃蛇→加排行榜/双人对战/加道具）
- 任务提示词：从 `task-info` 的当前任务描述中提取关键动作
- 点击后将文字填入输入框并自动发送

**数据依赖**：
- 当前任务信息（来自 URL 参数 / Yjs `plan_tree`）
- 游戏类型（来自 design schema）

---

### 2. 游戏预览 (`preview`)

**定位**：运行游戏代码的 iframe 沙盒。

**保持现状**，idle 状态显示游戏手柄图标 + "点击运行游戏启动"。

无需改动。

---

### 3. 玩家统计 (`stats`)

**定位**：展示团队协作数据和贡献排行。

**视觉重做**，采用以下布局：

```
┌─────────────────────────────────────┐
│ PLAYER STATS                        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  3       │  │  127    │          │
│  │ 在线协作者│  │ 代码行数 │          │
│  └─────────┘  └─────────┘          │
│  ┌─────────┐  ┌─────────┐          │
│  │  8       │  │  5      │          │
│  │ AI 对话次│  │ 预览运行 │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  ── 贡献排行 ──                     │
│  🥇 玩家A  342 chars               │
│  🥈 玩家B  218 chars               │
│  🥉 玩家C  156 chars               │
│                                     │
│  ── 活跃度 ──                       │
│  ▓▓▓▓▓▓▓▓░░ 在线 2h 14m           │
│                                     │
└─────────────────────────────────────┘
```

**视觉规范**：
- 统计卡片：2x2 网格，每个卡片使用 `border-radius: 14px`，`background: var(--bg2)`，`border: 1px solid var(--border)`
- 数字：`font-family: var(--font-code)`，`font-size: 24px`，`font-weight: 800`，颜色使用对应语义色
- 标签：`font-size: 10px`，`color: var(--textd)`，`letter-spacing: 1px`
- 排行列表：每行使用 `padding: 8px 10px`，`border-radius: 12px`，hover 时 `background: var(--bg3)`
- 活跃度进度条：`height: 6px`，`border-radius: 999px`，渐变填充 `linear-gradient(90deg, var(--accent), var(--green))`

**数据来源**：
- Yjs awareness（在线用户数）
- 编辑器操作计数（本地统计 + Yjs 同步）
- AI 对话次数（本地计数）
- 预览运行次数（本地计数）

**空状态**：
- 显示 2x2 骨架卡片，数字位置用 `--` 替代
- 排行区域显示："开始协作后，排行榜将自动更新"

---

### 4. 协作战况 (`activity`)

**定位**：实时协作事件流。

**保持现有设计方向**，补充初始内容：

- 进入工作台时自动插入第一条事件："[用户名] 进入了工作台"
- 事件类型及对应图标：
  - 进入/离开：`i-users` + green/grey
  - 编辑代码：`i-code` + purple
  - 运行预览：`i-gamepad` + green
  - 发送消息：`i-chat` + gold
  - AI 对话：`i-sparkles` + purple
  - 设计变更：`i-brush` + pink

**空状态**：
- 脉冲动画圆点 + "等待第一次协作事件..."

---

### 5. 团队聊天 (`chat`)

**定位**：团队实时沟通频道，与规划台讨论完全一致。

**完整复制 plan.html 的 ChatPanel 实现**，包含：

**结构**：
```
┌─────────────────────────────────────┐
│ ● 12 条消息              ↻ 同步中   │
├─────────────────────────────────────┤
│                                     │
│  [头像] 玩家名          10:23       │
│  ┌─────────────────────┐            │
│  │ 消息气泡内容         │            │
│  └─────────────────────┘            │
│                                     │
│  [✨] 主持 AI           10:24       │
│  ┌─────────────────────┐            │
│  │ AI 回复（紫色气泡）  │            │
│  └─────────────────────┘            │
│                                     │
├─────────────────────────────────────┤
│ [输入框 Shift+Enter换行]    [发送]  │
│ [表情] [@ 成员] [@AI] [AI整理]      │
└─────────────────────────────────────┘
```

**功能清单**（与 plan.html 一致）：
- 消息列表：支持玩家消息（灰色气泡）+ AI 消息（紫色气泡）
- 输入框：Shift+Enter 换行，Enter 发送，自动展开高度（max 100px）
- 表情选择器：20 个常用表情的 popup grid
- @提及：用户列表 popup + @AI 快捷按钮
- AI 整理按钮：触发 AI 分析讨论内容
- 打字指示器：三点跳动动画
- 流式回复：AI 回复实时渲染

**数据同步**：
- 使用与 plan.html 相同的 Yjs `yChat` 数组
- 规划台和工作台共享同一个聊天频道（同一个 room）
- Awareness 同步在线用户

**CSS**：直接复用 plan.html 的 `.chat-panel`、`.msg`、`.msg-bub-player`、`.msg-bub-ai`、`.chat-input`、`.chat-toolbar`、`.chat-tool` 等全部样式。

---

### 6. 智慧树 (`design-graph`)

**定位**：可视化任务/结构树 + AI 智能整理。合并了原 `tasks`、`task-list-agent`、`design-graph` 的功能。

**核心改动**：接入 AI API，实现与规划台共识窗口相同的"AI 整理→生成树"流程。

**结构**：
```
┌─────────────────────────────────────────────┐
│ 智慧树           [我的任务 ▼] [AI 整理]     │
├─────────────────────────────────────────────┤
│                                              │
│  选择模式切换：                               │
│  ┌───────────┐ ┌───────────┐                │
│  │ 🎯 我的任务│ │ 🌳 全局    │                │
│  └───────────┘ └───────────┘                │
│                                              │
│       ┌──────────┐                          │
│       │ 游戏根节点 │ (accent 色 pill)        │
│       └────┬─────┘                          │
│     ┌──────┼──────┐                         │
│  ┌──┴──┐┌──┴──┐┌──┴──┐                     │
│  │节点A ││节点B ││节点C │                     │
│  │待办  ││进行中││已完成│                     │
│  └─────┘└─────┘└─────┘                      │
│                                              │
│  ── 共识摘要 ──                              │
│  ✓ 已确认：基础玩法采用经典贪吃蛇             │
│  → 下一步：加入道具系统                       │
│                                              │
├─────────────────────────────────────────────┤
│  [待确认问题 2] [潜在冲突 1]                  │
└─────────────────────────────────────────────┘
```

**两种视图模式**：
1. **我的任务**：只显示当前用户认领的任务节点及其子节点树
2. **全局视图**：显示整个游戏的完整结构树（与规划台的可视化树一致）

**AI 整理功能**：
- 点击"AI 整理"按钮，调用 `callAI()` 分析当前任务上下文
- AI 返回结构化 JSON（与 plan.html 的 `SummaryPanel` 格式一致）：
  ```json
  {
    "concept": "游戏概念",
    "consensus": ["共识1", "共识2"],
    "nextSteps": ["下一步1"],
    "openQuestions": ["问题1"],
    "conflicts": ["冲突1"]
  }
  ```
- 整理结果显示在树的下方作为"共识摘要"区域

**节点卡片样式**：
- 使用现有 `.studio-window__node-btn` 样式
- 状态颜色：待办=`var(--textd)`，进行中=`var(--accent)`，已完成=`var(--green)`
- 节点间连线：SVG path，`stroke: var(--border)`，`stroke-width: 1.8`

**数据来源**：
- Yjs `plan_tree`（与规划台共享）
- Yjs `agent_tasks`（Agent 拆分的任务）
- 当前用户认领的节点列表（从 URL 参数 / localStorage 传入）

---

### 7. 设计 Agent (`design-vibe`)

**定位**：专业设计 AI 助手，内置 UI/UX 设计 Skill。

**改造为专门的设计聊天 Agent**，不再是简单的 vibe 面板：

**结构**：
```
┌─────────────────────────────────────┐
│ DESIGN AGENT          ● 设计模式    │
├─────────────────────────────────────┤
│                                     │
│  [✨] Design Agent      刚刚        │
│  ┌─────────────────────┐            │
│  │ 你好！我是你的专属设计│            │
│  │ 助手。我可以帮你：    │            │
│  │ • 生成配色方案        │            │
│  │ • 优化 UI 布局        │            │
│  │ • 设计游戏视觉风格    │            │
│  │ • 创建组件样式        │            │
│  └─────────────────────┘            │
│                                     │
│  ── 设计技能 ──                     │
│  [配色] [布局] [动效] [字体]        │
│                                     │
├─────────────────────────────────────┤
│ [输入你的设计需求...]       [发送]   │
│ [Vibe风格] [Web组件] [游戏UI]       │
└─────────────────────────────────────┘
```

**AI 设计 Skill 集成**：
- 系统提示词中注入 UI/UX 设计专业知识
- 快捷 Skill 按钮：
  - **配色**：生成符合游戏主题的色彩方案
  - **布局**：优化页面/游戏画面布局
  - **动效**：建议 CSS 动画和过渡效果
  - **字体**：推荐字体搭配方案
- 聊天工具栏的快捷入口：
  - **Vibe 风格**：触发 vibe 风格生成（春意/危险/柔和/机械等）
  - **Web 组件**：生成 Web UI 组件代码
  - **游戏 UI**：生成游戏界面元素

**System Prompt 示例**：
```
你是一个专业的游戏 UI/UX 设计 Agent。你擅长：
1. 色彩理论与配色方案设计
2. 游戏界面布局与信息架构
3. CSS 动画与微交互设计
4. 响应式设计与组件化
当用户描述设计需求时，你应该给出具体的 CSS 代码和视觉建议。
```

**数据来源**：
- 独立的 AI 消息存储（`aiMessageStores[instanceId]`）
- 设计 schema 状态（`designStudioState`）
- 当前游戏代码（用于分析现有样式）

---

### 8. 设计预览 (`web-design`)

**定位**：合并 Web Design 令牌控制 + 游戏样机预览。

**双模式切换**：

```
┌─────────────────────────────────────────────┐
│ 设计预览     [Web 令牌] [游戏样机]           │
├─────────────────────────────────────────────┤
│                                              │
│  === Web 令牌模式 ===                        │
│  当前节点布局                                │
│  [Console] [Product] [Soft Card]            │
│                                              │
│  网页层令牌                                  │
│  间距 ──────●────── 16px                    │
│  圆角 ──●────────── 4px                     │
│  阴影 ────────●──── medium                  │
│                                              │
│  [重置节点] [应用到游戏]                      │
│                                              │
│  === 游戏样机模式 ===                        │
│  [🖥 现代] [📺 复古] [🎮 街机] [🎮 掌机]     │
│  ┌─────────────────────────────┐            │
│  │    ┌───────────────┐        │            │
│  │    │               │        │            │
│  │    │   游戏 iframe  │        │            │
│  │    │               │        │            │
│  │    └───────────────┘        │            │
│  └─────────────────────────────┘            │
│                                              │
└─────────────────────────────────────────────┘
```

**Web 令牌模式**：保留现有 `renderWebDesignWindow` 的功能
**游戏样机模式**：移入原 `mockup` 窗口的全部功能（iframe + 机型切换）

**切换方式**：窗口标题栏右侧的 pill 按钮切换

---

### 9. 任务提示词 (`task-prompt`)

**定位**：查看/编辑 AI 任务提示词。

**保持现状**，补充：
- 从 `task-info` 自动加载当前任务的 prompt 模板
- 变量高亮：`{{变量名}}` 以 `var(--accent)` 色显示
- 底部"提交给 Brain"按钮保持

---

### 10. 个人工作台 (`personal-ws`)

**定位**：团队成员列表和个人状态。

**保持现状**，补充空状态：

```
┌─────────────────────────────┐
│ WORKSPACE              0    │
├─────────────────────────────┤
│                             │
│      ┌───┐                  │
│      │ 😊 │ (我的头像)       │
│      └───┘                  │
│   你是第一个到达的人         │
│   ● 在线                    │
│                             │
│   等待队友加入...            │
│   ·  ·  · (脉冲动画)        │
│                             │
├─────────────────────────────┤
│ [个人笔记...]               │
└─────────────────────────────┘
```

- 即使没有其他协作者，也显示自己的卡片
- 自己的卡片始终在最上方，使用 `pw-me` 高亮样式
- 其他用户卡片显示在线状态 dot + 当前正在做的事情

---

### 11. 任务面板 (`task-info`)

**定位**：当前任务的详细信息。

**保持现状**，补充数据自动填充：

- 从 URL 参数（`?task=xxx&cat=xxx`）读取任务 ID
- 从 Yjs `plan_tree` / `agent_tasks` 加载任务详情：
  - 任务标题
  - 分类标签（带颜色 badge）
  - 任务描述
  - 关联的树节点列表
  - 进度条

**空状态**：
- 虚线框 + 任务图标 + "选择一个任务节点开始"

---

### 12. 游戏概览 (`design-tree`)

**定位**：游戏设计 HUD 仪表盘。

**保持现有 `renderDesignTreeWindow` 实现**，它已经有：
- 游戏概念摘要
- 实时状态（当前节点、协作者数、预览状态、待处理变更）
- 变更历史
- 任务规划进度

无需大改。

---

### 13. 代码编辑器 (`editor`)

**保持现状**。已有完整的编辑器实现。

---

### 14. 代码地图 (`codemap`)

**保持现状**。canvas 缩略图。

---

## 四、模式-窗口映射更新

```javascript
const MODE_WINS = {
  dev:    ['editor', 'preview', 'codemap'],
  design: ['design-tree', 'design-graph', 'design-vibe', 'web-design', 'preview'],
  chat:   ['chat', 'activity', 'stats', 'ai'],
  game:   ['web-design'],  // web-design 现在包含游戏样机
  task:   ['design-graph', 'task-prompt', 'ai', 'preview'],
}
```

**个人工作台模式（pw-*）的分类预设更新**：
```javascript
function getCategoryPresetWins(catLabel) {
  // 通用
  default: ['personal-ws', 'task-info', 'ai', 'preview']
  // 代码类
  code:    ['personal-ws', 'task-info', 'editor', 'preview', 'codemap']
  // 设计类
  design:  ['personal-ws', 'task-info', 'design-vibe', 'web-design', 'preview']
  // 系统类
  system:  ['personal-ws', 'task-info', 'design-tree', 'design-graph', 'ai']
  // 场景类
  scene:   ['personal-ws', 'task-info', 'design-graph', 'preview', 'ai']
  // 故事类
  story:   ['personal-ws', 'task-info', 'ai', 'chat', 'preview']
}
```

---

## 五、WIN_DEFS 更新

```javascript
const WIN_DEFS = [
  {id:'ai',          name:'AI 助手',       icon:'i-sparkles',   color:'var(--purple)',  w:320, h:400, x:0, y:0},
  {id:'preview',     name:'游戏预览',      icon:'i-gamepad',    color:'var(--green)',   w:500, h:400, x:330, y:0},
  {id:'editor',      name:'代码编辑器',    icon:'i-code',       color:'var(--purple)',  w:500, h:400, x:0, y:0},
  {id:'stats',       name:'玩家统计',      icon:'i-bar-chart',  color:'var(--accent)',  w:280, h:320, x:840, y:0},
  {id:'activity',    name:'协作战况',      icon:'i-zap',        color:'var(--gold)',    w:280, h:280, x:840, y:190},
  {id:'chat',        name:'团队聊天',      icon:'i-chat',       color:'var(--green)',   w:320, h:400, x:0, y:0},
  {id:'design-tree', name:'游戏概览',      icon:'i-map',        color:'var(--green)',   w:300, h:400, x:0, y:0},
  {id:'design-graph',name:'智慧树',        icon:'i-grid',       color:'var(--accent)',  w:620, h:460, x:0, y:0},
  {id:'design-vibe', name:'设计 Agent',    icon:'i-sparkles',   color:'var(--pink)',    w:320, h:400, x:0, y:0},
  {id:'web-design',  name:'设计预览',      icon:'i-monitor',    color:'var(--orange)',  w:500, h:400, x:0, y:0},
  {id:'codemap',     name:'代码地图',      icon:'i-map',        color:'var(--green)',   w:180, h:300, x:0, y:0},
  {id:'task-prompt', name:'任务提示词',    icon:'i-clipboard',  color:'var(--orange)',  w:300, h:320, x:0, y:0},
  {id:'personal-ws', name:'个人工作台',    icon:'i-users',      color:'var(--accent2)', w:220, h:400, x:0, y:0},
  {id:'task-info',   name:'任务面板',      icon:'i-clipboard',  color:'var(--gold)',    w:300, h:400, x:0, y:0},
]
```

---

## 六、视觉规范要点

所有窗口必须遵循以下规范（源自现有设计系统）：

### 颜色
- 背景层级：`var(--bg)` → `var(--bg2)` → `var(--bg3)` → `var(--bg4)`
- 文字层级：`var(--text)` → `var(--textm)` → `var(--textd)`
- 语义色：绿=成功/活跃，紫=AI/创作，金=任务/成就，粉=设计/警告，蓝=信息/编辑
- 暗黑/亮色主题通过 CSS 变量自动适配

### 卡片
- `border-radius: 12-14px`
- `border: 1px solid var(--border)`
- `background: var(--bg2)`
- hover: `border-color: var(--border-h)` + `background: var(--bg3)`

### 文字
- 标题：`var(--font-head)`，14px+，weight 700-800
- 正文：`var(--font-ui)`，11-12px，weight 400-500
- 标签/代码：`var(--font-code)`，9-10px，`letter-spacing: 1-1.5px`

### 按钮/Pills
- `border-radius: var(--radius-full)` = 999px
- `padding: 4-6px 10-14px`
- `font-size: 10px`，`font-family: var(--font-code)`
- 激活态：`background: var(--xxx-bg)`，`border-color: var(--xxx)`，`color: var(--xxx)`

### 空状态
- 居中布局，`flex-direction: column`，`align-items: center`，`gap: 10px`
- 图标：40px，`color: var(--textd)`
- 文字：`font-size: 10-11px`，`color: var(--textd)`，`text-align: center`
- 可选：脉冲动画（`animation: pulse 2.5s infinite`）

### 滚动
- `overflow-y: auto`
- 滚动条：4px 宽，`var(--scrollbar)` 色，`border-radius: 3px`

---

## 七、技术实施要点

### API 调用
所有 AI 功能使用现有的 `callAI()` 函数：
- 端点：`/api/chat`（代理到用户配置的 API 地址）
- 流式输出：SSE `data:` 格式
- 配置：从 localStorage 读取 `codelab_api_key`、`codelab_api_base`、`codelab_api_model`

### Yjs 共享数据
工作台与规划台共享同一个 Yjs 文档（`codelab3-{roomId}`）：
- `yChat`（Y.Array）：聊天消息
- `yTasks`（Y.Array）：任务列表
- `plan_tree`（Y.Map）：智慧树结构
- `agent_tasks`（Y.Map）：Agent 拆分的任务
- `plan_summary`（Y.Map）：AI 整理的共识摘要
- `assembled_html`（Y.Map）：汇编的游戏代码

### 窗口实例化
- 删除 `tasks`、`design`、`mockup`、`task-list-agent` 的 `buildWinContent` 分支
- 新增/改造 `chat`、`design-graph`、`design-vibe`、`web-design`、`stats` 的 `buildWinContent`
- `chat` 窗口需要将 plan.html 的 React 组件转写为原生 JS（或直接内嵌 preact/htm）

---

## 八、实施优先级

| Phase | 窗口 | 工作量 | 原因 |
|---|---|---|---|
| P0 | `chat` 团队聊天 | 大 | 当前 body 完全为空，是最明显的缺失 |
| P0 | `stats` 玩家统计视觉重做 | 中 | 用户明确要求重做 |
| P0 | `design-graph` 智慧树改造 | 大 | 合并多窗口 + 接入 AI API |
| P1 | `ai` 推荐提示词栏 | 小 | 锦上添花，工作量小 |
| P1 | `design-vibe` 设计 Agent | 中 | 改为聊天式 Agent |
| P1 | `web-design` 合并游戏样机 | 中 | 合并两个窗口 |
| P2 | `personal-ws` 空状态优化 | 小 | 补充自己的卡片 |
| P2 | `task-info` 数据自动填充 | 小 | 读取 URL 参数 |
| P2 | `activity` 初始事件 | 小 | 补一条进入事件 |
| P2 | `task-prompt` 变量高亮 | 小 | 小优化 |

---

## 九、删除清单

实施时需要从代码中移除：

1. `WIN_DEFS` 中删除：`tasks`、`design`、`mockup`、`task-list-agent`
2. `MODE_WINS` / `MODE_WINS_DEFAULT` 中更新引用
3. `getCategoryPresetWins()` 中更新引用
4. `buildWinContent()` 中删除对应的 `else if` 分支
5. `getPresetLayout()` 中删除对应的布局定义
6. 相关 CSS 可保留（不会造成副作用）
