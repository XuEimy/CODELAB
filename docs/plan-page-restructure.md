# CODELAB 规划页 (plan.html) UI 重构需求文档

> 文件：`/public/plan.html`（单文件 React SPA，约 3100 行）
> 日期：2026-03-28

---

## 一、背景

当前规划页有 5 个固定窗口：讨论室、共识与下一步、待确认与冲突、Agent 任务、智慧树。
多人协作时存在以下问题：
1. "实时整理"自动触发太频繁，4 人协作时 AI 一直在整理，体验混乱
2. Agent 任务窗口功能与智慧树高度重合，占位但价值有限
3. "在讨论室中讨论"按钮只是跳转焦点，没有形成完整体验闭环
4. "跳过规划"措辞不当

---

## 二、窗口布局变更

### 当前布局（5 窗口）
```
┌─────────┬────────────┬────────────┬────────────┐
│         │  共识与     │  待确认     │  AGENT     │
│  讨论室  │  下一步     │  与冲突     │  任务       │
│  (28%)  │  (1/3)     │  (1/3)     │  (1/3)     │
│         ├────────────┴────────────┴────────────┤
│         │                                      │
│         │            智慧树 (100%)              │
│         │                                      │
└─────────┴──────────────────────────────────────┘
```

### 目标布局（5 窗口，Agent → Demo）
```
┌─────────┬────────────┬────────────┬────────────┐
│         │  共识与     │  待确认     │  DEMO      │
│  讨论室  │  下一步     │  与冲突     │  预览       │
│  (28%)  │  (1/3)     │  (1/3)     │  (1/3)     │
│         ├────────────┴────────────┴────────────┤
│         │ [生成需求] [快速拆分] [AI拆分]  图例... │
│         │            智慧树 (100%)              │
│         │ ─── AGENT 任务列表 ───               │
└─────────┴──────────────────────────────────────┘
```

---

## 三、详细需求

### 需求 1：取消自动整理，改为手动点击整理

**现状**：每新增 10 条消息 + 60 秒间隔自动触发 `handleRefreshSummary`

**目标**：
- 删除自动触发逻辑（auto-refresh useEffect）
- 保留"共识与下一步"和"待确认与冲突"窗口标题栏的"刷新"按钮（手动触发）
- 点击后在按钮文字上显示"XXX 正在整理..."（XXX = 点击者的用户名）
- 其他协作者也能看到是谁在整理（通过 Yjs awareness 同步）
- 整理期间其他人不可重复点击

**涉及代码**：
- 删除：`lastSummaryCountRef`、`lastSummaryTimeRef`、auto-refresh `useEffect`
- 新增：通过 Yjs awareness 广播 `refreshing` 状态 `{ active, by }`
- 修改：PlanWorkspace 窗口标题栏的刷新按钮，显示操作者名称
- 修改：SummaryPanel 的 loading 指示器，显示操作者名称

---

### 需求 2：删除 "Agent 任务" 窗口，替换为 "Demo 预览" 窗口

**现状**：Agent 任务窗口包含"生成需求"、"快速拆分"、"AI 拆分"按钮 + "下一步行动"列表 + Agent 任务列表

**目标**：
- 窗口 ID 从 `agent` 改为 `demo`，标题改为 `DEMO 预览`
- 内容为 sandboxed iframe，实时预览 AI 拆分生成的完整 HTML 代码
- 数据源：已有的 `yAssembledHtml` Yjs Map（存储了 Brain Agent 生成的 `assembledHtml`）
- 空状态提示："使用「AI 拆分」生成代码后，预览将在此显示"
- 窗口标题栏右侧显示版本号（`v1`、`v2`...）

**新增组件**：
- `useAssembledHtml(yjsRef)` hook — 从 Yjs 读取 html 和 version
- `DemoPanel({ html, version })` 组件 — iframe 预览

**安全约束**：iframe 使用 `sandbox="allow-scripts"`，隔离 AI 生成代码

---

### 需求 3：将 Agent 功能合并进智慧树

**3.1 按钮迁移到智慧树顶部工具栏**

将以下三个按钮从 Agent 窗口移到智慧树的 `.tree-header` 区域（与图例同行）：
- "生成需求" — 调用 `onGeneratePrompt`
- "快速拆分" — 调用 `onLocalSplit`
- "AI 拆分" — 调用 `onBrainSplit`

按钮尺寸缩小适配工具栏（height: 22px, fontSize: 9px）。

**3.2 "下一步行动" → 直接是智慧树本身**

智慧树已经通过 AI 整理生成的 `nodes`（含 `status: 'next'`）展示下一步。AgentTaskPanel 中的 `nextSteps` 列表是冗余的，删除即可。

**3.3 智慧树底部新增 Agent 任务列表**

在智慧树的分类/节点区域下方，新增一行"AGENT 任务"区域：
- 显示 AI 拆分生成的任务模块列表
- 每个任务显示：状态圆点、标题、摘要、认领按钮、"▶ 工作台"链接
- 仅在有任务时显示（无任务时不占空间）

**3.4 删除 AgentTaskPanel 组件**

功能全部迁移后，删除 `AgentTaskPanel` 函数定义。保留 `.agent-action-btn`、`.agent-task-*` 等 CSS 类（在新位置复用）。

**WisdomTree 新增 props**：
```
agentTasks, onClaim, brainBusy, brainStatus,
onBrainSplit, onLocalSplit, onGeneratePrompt,
hasStructuredPrompt, isTyping
```

**需要提取到模块作用域**：`AGENT_STATUS_COLORS` 和 `AGENT_STATUS_LABELS`（当前定义在 AgentTaskPanel 内部）。

---

### 需求 4：文案变更

| 位置 | 原文 | 改为 |
|------|------|------|
| Header 右上角 skip-btn | 跳过规划 → | 完成规划 → |

---

### 需求 5：完善"在讨论室中讨论"交互流程

**现状**："待确认与冲突"窗口中，"在讨论室讨论"按钮只是让聊天输入框获得焦点，无实质体验。

**目标交互流程**：

```
1. 用户在"待确认与冲突"窗口看到一个问题/冲突
2. 点击"在讨论室讨论"
3. 聊天输入框自动填入：
   关于问题: "XXX"        （或 关于冲突: "XXX"）
   我的看法是：
4. 光标定位到"我的看法是："后面，等待用户输入
5. 用户输入观点后点击发送
6. 发送成功后，该问题/冲突卡片上的按钮变为：
   [已讨论完成]  [重新整理]
   并显示"XXX 发起了讨论"（XXX = 发起者名称）
7. 点击"已讨论完成" → 标记为已完成，显示 ✓ 已讨论完成（绿色）
8. 点击"重新整理" → 触发 handleRefreshSummary
9. A 用户的操作对 B 用户可见（多人同步）
```

**状态同步（通过 Yjs）**：
- 在 `ySummary` Yjs Map 中新增独立的 `discussedItems` key
- 格式：`{ "question-0": { status: "discussing"|"done", by: "用户名", at: timestamp }, ... }`
- 注意：`discussedItems` 必须存储为 `ySummary` 的独立 key，不能放在 `data` 字段内，否则 `saveSummary` 时会被覆盖

**数据流**：
```
App
 ├→ PlanWorkspace
 │   ├→ ChatPanel
 │   │    新增 props: discussionTopic, onDiscussionSent
 │   │    行为: discussionTopic 变化时自动填入文本
 │   │          发送后调用 onDiscussionSent 更新 Yjs 状态
 │   │
 │   ├→ SummaryPanel (issues tab)
 │   │    新增 props: onDiscuss, discussedItems, onMarkDone, onRefresh
 │   │    行为: 点击"讨论"→ onDiscuss({ text, type, index })
 │   │          根据 discussedItems 显示不同按钮状态
 │   │
 │   ├→ DemoPanel (新)
 │   │    props: html, version
 │   │
 │   └→ WisdomTree (扩展)
 │        新增 props: agentTasks, onClaim, brainBusy, brainStatus,
 │                    onBrainSplit, onLocalSplit, onGeneratePrompt,
 │                    hasStructuredPrompt, isTyping
 │
 └→ App 状态
      新增: discussionTopic, refreshingBy, assembledHtml/version, discussedItems
```

---

## 四、不变更的部分

- 讨论室（ChatPanel）的核心聊天功能
- 共识与下一步（SummaryPanel consensus tab）的卡片展示
- AI 调用逻辑（callAI、handleAskAI、handleRefreshSummary、handleGenerateStructuredPrompt、handleBrainSplit）— 上一轮已优化
- Yjs 协同基础设施
- 设置面板（SettingsModal）
- 服务端（server.js）

---

## 五、实施顺序

| 步骤 | 需求 | 风险 | 说明 |
|------|------|------|------|
| 1 | 需求 4 | 低 | 单行文案改动，无依赖 |
| 2 | 需求 1 | 低 | 删除 auto-refresh，增加 awareness 广播 |
| 3 | 需求 2+3 | 中 | 窗口替换 + 组件迁移，耦合度高，需同时进行 |
| 4 | 需求 5 | 中 | 涉及跨组件通信和 Yjs 状态扩展 |

---

## 六、验证方法

1. 打开 `/plan` 页面，确认布局为 4+1（讨论室 + 3 个右上窗口 + 智慧树）
2. 确认右上角第三个窗口是 "DEMO 预览"，空状态有提示文字
3. 多人同时在线，A 点击"刷新"，B 能看到"A 正在整理..."
4. 智慧树顶部有"生成需求"、"快速拆分"、"AI 拆分"三个按钮
5. 执行"AI 拆分"后，Demo 窗口显示 iframe 预览，智慧树底部显示任务列表
6. 在"待确认与冲突"窗口点击"在讨论室讨论"，聊天框自动填入内容
7. 发送后，问题卡片显示"已讨论完成"和"重新整理"按钮
8. A 标记"已讨论完成"，B 同步看到绿色 ✓
9. 右上角按钮显示"完成规划 →"
