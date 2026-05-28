# Team Dashboard Design

**Goal:** Replace the empty `personal-ws` window with a shared real-time team dashboard that shows who is online, what each collaborator is doing, and which windows are being co-edited.

## Scope

- Keep `personal-ws` as a shared singleton window.
- Replace the current structured prompt reuse in `personal-ws` with a real dashboard surface.
- Show online collaborators, their current mode/task context, and the windows visible in their current workspace.
- Show active shared-window sessions, their owners, participants, and join/open actions.
- Preserve current visual language used by existing workbench windows.

## Layout

The dashboard is split into two stacked sections:

1. **Online Members**
   - Member cards with avatar, online state, current mode, current task/category, visible window count, and highlighted current workspace window.
   - Clicking a member card switches to that collaborator's `pw-<uid>` workspace.

2. **Shared Windows**
   - Session cards for active `shared_windows` records.
   - Each card shows the source window name, owner, participants, online count, and whether the local user has joined.
   - Clicking a session card opens the shared window if already joined, or joins then opens it.

## Data Sources

- Presence and mode: `getUsers()` / `yAware`
- Personal workspace metadata: `yPersonalWS`
- Current workspace windows: `MODE_WINS`, `getUserWindowInstances()`, `getPersonalWSEntry()`
- Shared sessions: `ydoc.getMap('shared_windows')`

## State Rules

- Only online users are shown in the member section.
- Prefer task/category context from `personal_workspaces`; otherwise show current mode label.
- Only valid shared sessions with a source window and participants are shown.
- The dashboard re-renders on presence, personal workspace, shared session, and mode/window changes.

## Visual Rules

- Use existing panel density, uppercase mini headers, pills, border rhythm, and accent colors already established in `app.html`.
- Avoid introducing a new visual language.
- Keep cards compact enough to fit the existing `personal-ws` window size.

## Testing

- Add model and render tests for the new dashboard module.
- Verify the app wires `personal-ws` to the dashboard instead of the structured prompt panel.
