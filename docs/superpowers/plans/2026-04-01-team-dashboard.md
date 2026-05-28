# Team Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `personal-ws` into a shared real-time team dashboard.

**Architecture:** Add a dedicated `public/team-dashboard.js` module that builds and renders the dashboard from normalized collaborators and shared-session inputs. Update `app.html` to source dashboard data from presence, personal workspace metadata, and shared window sessions, then mount that module into `personal-ws`.

**Tech Stack:** Vanilla JS modules, Yjs maps, existing workbench window shell, Node test runner, JSDOM.

---

### Task 1: Add dashboard module tests

**Files:**
- Create: `tests/team-dashboard.test.mjs`
- Read: `public/task-panels.js`

- [ ] **Step 1: Write failing tests for the model**
- [ ] **Step 2: Run `npm test -- tests/team-dashboard.test.mjs` and verify failure**
- [ ] **Step 3: Add failing render assertions for online members and shared sessions**

### Task 2: Implement dashboard module

**Files:**
- Create: `public/team-dashboard.js`
- Test: `tests/team-dashboard.test.mjs`

- [ ] **Step 1: Implement the smallest model builders needed by the tests**
- [ ] **Step 2: Implement HTML render helpers using existing window density**
- [ ] **Step 3: Re-run `npm test -- tests/team-dashboard.test.mjs` until green**

### Task 3: Wire `personal-ws` to the new dashboard

**Files:**
- Modify: `public/app.html`
- Test: `tests/team-dashboard.test.mjs`

- [ ] **Step 1: Import the dashboard module in `app.html`**
- [ ] **Step 2: Replace the `personal-ws` structured-prompt mount with the dashboard root**
- [ ] **Step 3: Add dashboard data collection and light interaction handlers**
- [ ] **Step 4: Re-render on presence, personal workspace, shared session, and mode changes**

### Task 4: Add styling and targeted verification

**Files:**
- Modify: `public/app.html`
- Test: `tests/team-dashboard.test.mjs`
- Test: `tests/app-module-parse.test.mjs`

- [ ] **Step 1: Add compact dashboard-specific styles that follow current window rules**
- [ ] **Step 2: Run `npm test -- tests/team-dashboard.test.mjs tests/app-module-parse.test.mjs`**
- [ ] **Step 3: Fix any regressions and keep the implementation minimal**
