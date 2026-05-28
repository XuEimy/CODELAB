export const SLASH_PLACEHOLDER = 'Say something'
export const SLASH_FADE_START_MS = 1400
export const SLASH_FADE_DURATION_MS = 800
export const SLASH_CLEAR_MS = SLASH_FADE_START_MS + SLASH_FADE_DURATION_MS

export function normalizePresenceScope(mode = 'chat') {
  if (typeof mode !== 'string' || !mode.trim()) return 'chat'
  if (mode.startsWith('pw-')) return `pw:${mode.slice(3)}`
  return mode
}

export function shouldRenderPresenceForUser({
  currentMode = 'chat',
  remoteMode = 'chat',
  myUserId = '',
  remoteUserId = '',
  hasCursor = false,
} = {}) {
  if (!hasCursor) return false
  if (!remoteUserId || remoteUserId === myUserId) return false
  return normalizePresenceScope(currentMode) === normalizePresenceScope(remoteMode)
}

export function getSpeechBubbleVisualState(speech, now = Date.now()) {
  if (!speech?.active) {
    return {
      bubbleVisible: false,
      done: false,
      fading: false,
      opacity: 0,
      text: '',
    }
  }

  const updatedAt = Number.isFinite(speech.updatedAt) ? speech.updatedAt : now
  const age = Math.max(0, now - updatedAt)
  const fading = age > SLASH_FADE_START_MS && age < SLASH_CLEAR_MS
  const opacity = age <= SLASH_FADE_START_MS
    ? 1
    : Math.max(0, 1 - ((age - SLASH_FADE_START_MS) / SLASH_FADE_DURATION_MS))

  return {
    bubbleVisible: age <= SLASH_CLEAR_MS,
    done: age > SLASH_CLEAR_MS,
    fading,
    opacity: opacity > 0 ? Number(opacity.toFixed(3)) : 0,
    text: speech.text || SLASH_PLACEHOLDER,
  }
}

export function shouldMutePresenceLayer({
  settingsOpen = false,
  winPanelOpen = false,
  sharedInviteOpen = false,
  newWorkspaceOpen = false,
} = {}) {
  return Boolean(settingsOpen || winPanelOpen || sharedInviteOpen || newWorkspaceOpen)
}
