# Editor Window Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade only the code editor window into a structured multi-file workspace with richer code readability and navigation, while preserving current room collaboration and run behavior.

**Architecture:** Introduce a small virtual workspace layer that maps the current single HTML source into logical files (`index.html`, `styles/game.css`, `scripts/game.js`) and bundles them back for preview/runtime. Keep the editor input textarea-backed for stability, but render a syntax-highlight layer, file tree, tabs, breadcrumbs, minimap, and stronger status feedback inside the editor window only.

**Tech Stack:** Existing `public/app.html` module script, Yjs shared state, Node test runner, lightweight custom helper modules in `public/`

---

### Task 1: Add Workspace Parsing Helpers

**Files:**
- Create: `public/editor-workspace.js`
- Test: `tests/editor-workspace.test.mjs`

- [ ] **Step 1: Write the failing tests**
  Cover:
  - split a standalone HTML document into `index.html`, `styles/game.css`, and `scripts/game.js`
  - rebuild the standalone HTML from those files
  - infer language from file path

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- tests/editor-workspace.test.mjs`
  Expected: FAIL because `public/editor-workspace.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**
  Implement helpers for:
  - extracting HTML/CSS/JS sections
  - building a file list with labels and language metadata
  - bundling the workspace files into runnable HTML

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- tests/editor-workspace.test.mjs`
  Expected: PASS

### Task 2: Add Syntax Highlight Helpers

**Files:**
- Create: `public/editor-highlight.js`
- Test: `tests/editor-highlight.test.mjs`

- [ ] **Step 1: Write the failing tests**
  Cover:
  - HTML tags/attributes/strings are wrapped in distinguishable token spans
  - CSS selectors/properties/values are wrapped in distinguishable token spans
  - JS keywords/functions/strings/comments are wrapped in distinguishable token spans
  - raw text is escaped safely

- [ ] **Step 2: Run test to verify it fails**
  Run: `npm test -- tests/editor-highlight.test.mjs`
  Expected: FAIL because helper module does not exist yet

- [ ] **Step 3: Write minimal implementation**
  Implement:
  - safe escaping
  - language-aware tokenization with lightweight regex rules
  - a renderer that returns highlighted HTML for the active file

- [ ] **Step 4: Run test to verify it passes**
  Run: `npm test -- tests/editor-highlight.test.mjs`
  Expected: PASS

### Task 3: Replace The Editor Window Markup

**Files:**
- Modify: `public/app.html`

- [ ] **Step 1: Update editor window markup**
  Replace the current plain editor body with:
  - file tree sidebar
  - tabs and breadcrumb strip
  - line numbers
  - syntax-highlight presentation layer
  - textarea-backed input layer
  - minimap
  - richer footer/status bar

- [ ] **Step 2: Add editor-specific styles**
  Add CSS only for editor-window internals:
  - sidebar
  - tabs
  - breadcrumb
  - token colors
  - active line
  - minimap
  - stronger caret/selection treatment

- [ ] **Step 3: Keep non-editor windows untouched**
  Re-check that no markup or styling changes are made to other windows

### Task 4: Introduce Virtual Workspace State In App Logic

**Files:**
- Modify: `public/app.html`
- Read: `public/editor-workspace.js`

- [ ] **Step 1: Add workspace state**
  Add:
  - active file id/path
  - ordered file list
  - open tab list
  - helpers to read/write active file content

- [ ] **Step 2: Initialize workspace from current shared HTML**
  On first sync:
  - convert current HTML document into logical files
  - keep a consistent default file order

- [ ] **Step 3: Update editor synchronization**
  Ensure:
  - typing edits only the active file
  - file switches refresh the editor view
  - line numbers, footer info, and minimap update with the active file

- [ ] **Step 4: Preserve collaboration behavior**
  Keep shared synchronization working through Yjs by storing/retrieving workspace content consistently for all users

### Task 5: Update Runtime Bundling For Preview And Existing Actions

**Files:**
- Modify: `public/app.html`
- Read: `public/editor-workspace.js`

- [ ] **Step 1: Route `runAll()` through the workspace bundle**
  Ensure preview and mockup iframe use the rebuilt standalone HTML, not just the active file

- [ ] **Step 2: Update AI apply flow**
  When AI returns full HTML:
  - convert it into workspace files
  - refresh open editor state

- [ ] **Step 3: Update design-apply flow**
  Ensure existing design tools still modify the bundle source in a coherent way

- [ ] **Step 4: Keep stats and code counts meaningful**
  Base counts on the bundled output or aggregated workspace content consistently

### Task 6: Add Editor Interaction Polish

**Files:**
- Modify: `public/app.html`

- [ ] **Step 1: Add file-tree selection behavior**
  Clicking a file updates:
  - active tab
  - breadcrumb
  - syntax highlight
  - status bar

- [ ] **Step 2: Add minimap navigation**
  Clicking the minimap scrolls the active file

- [ ] **Step 3: Add current-line and token feedback**
  Update rendering on:
  - input
  - click
  - keyup
  - scroll

- [ ] **Step 4: Preserve familiar shortcuts**
  Keep:
  - `Tab`
  - `Ctrl/Cmd+Enter`
  - `Ctrl/Cmd+S`

### Task 7: Verify End-To-End Behavior

**Files:**
- Test: `tests/editor-workspace.test.mjs`
- Test: `tests/editor-highlight.test.mjs`
- Test: existing tests

- [ ] **Step 1: Run focused tests**
  Run: `npm test -- tests/editor-workspace.test.mjs tests/editor-highlight.test.mjs`
  Expected: PASS

- [ ] **Step 2: Run full test suite**
  Run: `npm test`
  Expected: PASS with all tests green

- [ ] **Step 3: Run manual smoke checklist**
  Verify manually:
  - editor window shows file tree, tabs, breadcrumb, minimap
  - typing in active file updates highlighted surface
  - switching files preserves content
  - running game still works
  - other windows look unchanged

- [ ] **Step 4: Package deliverable**
  Rebuild the ZIP deliverable after verification
