# Editor Window Design

**Date:** 2026-03-20

**Goal:** Upgrade only the in-app code editor window so it becomes materially easier for experienced programmers to write, navigate, and manage game code, without changing the rest of the workspace UI or breaking current collaboration behavior.

## Scope

This design intentionally changes only the editor window interior:

- Add a lightweight workspace sidebar inside the editor window
- Add file tabs and breadcrumbs inside the editor window
- Replace the plain textarea presentation with a richer editing surface
- Add syntax-aware rendering, stronger caret/current-line feedback, and a minimap
- Keep the rest of the app layout, top bars, preview window, AI window, and collaboration model visually unchanged

Out of scope for this phase:

- Redesigning the overall workspace shell
- Moving or resizing non-editor windows
- Changing the room system, LAN collaboration, or invite flow
- Adding a heavy IDE clone or desktop-style command palette

## Product Intent

The editor should feel purpose-built for collaborative web game creation, not like a stripped-down clone of VS Code and not like a terminal textarea. The user should still feel like they are directly editing code, but with stronger visual structure and far better reading/writing ergonomics.

The chosen direction is a hybrid of:

- **Structured Workspace**: clear file/package grouping inside the editor window
- **Hybrid Pro**: targeted professional affordances like syntax colors, minimap, breadcrumbs, current-line emphasis, and stronger cursor presence

## UX Principles

1. **Do not fight existing habits**
   The user still clicks into a code area and types. Common editing actions should feel familiar and immediate.

2. **Structure without heaviness**
   File and package organization should help people reason about code, but it should not require learning an IDE.

3. **Visual hierarchy matters**
   The active file, active line, current symbol zone, and syntax category should be visually obvious at a glance.

4. **Only local window change**
   Any added controls must live inside the editor window. The surrounding application should look and behave the same.

## Information Architecture Inside The Editor Window

The editor window becomes a four-part interior:

1. **Top strip**
   - open file tabs
   - breadcrumb path for the active file

2. **Left sidebar**
   - lightweight file tree
   - grouped by package/folder
   - optimized for game/web project structure

3. **Main editing area**
   - line numbers
   - syntax-highlight layer
   - textarea-backed input surface so typing remains simple and stable
   - active-line highlight
   - bracket/tag pairing emphasis

4. **Right minimap**
   - small, glanceable overview
   - supports quick long-file navigation

5. **Bottom status bar**
   - line/column
   - language
   - indentation info
   - file stats

## File Model

The current project uses a single HTML string as its source of truth. To improve manageability without changing the rest of the app experience, the editor should introduce a lightweight virtual workspace model.

Default virtual files:

- `index.html`
- `styles/game.css`
- `scripts/game.js`

Behavior:

- Existing single-file game code is split into these files on load
- Editing happens per virtual file inside the editor window
- Running the game re-bundles the workspace back into a single HTML document for the preview iframe
- Collaboration remains shared because the workspace data is synchronized through Yjs

This preserves the app’s current runtime assumptions while making the editor far easier to manage.

## Interaction Design

### Sidebar

- Single click changes active file
- Folders are visual only for now; no complex explorer behavior in phase one
- Active file is strongly highlighted

### Tabs

- Show currently open files
- Keep the count small and obvious
- No heavy tab management behavior in phase one

### Editing Surface

- Textarea remains the input source for stability and collaboration sync
- A syntax-highlight layer mirrors the text behind or beneath the input
- Caret color stays highly visible
- Current line receives a soft full-width highlight
- Selection color is more legible than the current implementation

### Syntax Treatment

- HTML tags/attributes/strings visually distinct
- CSS selectors/properties/values visually distinct
- JS keywords/functions/strings/numbers/comments visually distinct

### Minimap

- Represents the active file only
- Clicking a region scrolls the active file
- Uses syntax-family colors where practical

## Visual Direction

The visual direction should feel more premium and deliberate than a plain IDE clone:

- darker layered surfaces with clearer depth separation
- stronger accent contrast for active code context
- restrained neon accents tied to the existing app palette
- purposeful typography and spacing tuned for sustained reading

The editor should read as “specialized collaborative game editor” rather than “generic code app”.

## Technical Design

New helper modules should isolate complexity from `public/app.html`.

Recommended modules:

- `public/editor-workspace.js`
  - parse single HTML into virtual files
  - bundle virtual files back into runnable HTML
  - expose file metadata and language helpers

- `public/editor-highlight.js`
  - lightweight tokenization/highlighting for HTML/CSS/JS
  - escape and render highlighted HTML

`public/app.html` remains the integration point, but window-specific logic should be moved into focused helpers where possible.

## Collaboration Expectations

The collaboration model must remain intact:

- editor content still syncs across peers
- room behavior does not change
- remote cursors elsewhere in the app are unaffected

Phase one does not need per-file remote cursors inside the code surface; preserving stable shared editing is the priority.

## Testing Strategy

Test pure logic first:

- split HTML into workspace files
- rebuild runnable HTML from workspace files
- detect file language from path
- render syntax-highlight output for representative HTML/CSS/JS snippets

Manual verification after implementation:

- open room with two peers
- edit active file and confirm sync still works
- switch files and run game
- verify preview still launches the bundled result
- confirm non-editor windows visually remain unchanged

## Success Criteria

This phase succeeds if:

- the editor window alone looks and feels materially more professional
- code is easier to read and navigate than before
- the user can manage code through multiple logical files/packages
- current collaboration and run behavior still work
- no surrounding window or shell UI is redesigned
