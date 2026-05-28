import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const modulePath = path.resolve(import.meta.dirname, '..', 'public', 'presence-ui.js')
const moduleUrl = pathToFileURL(modulePath).href

test('presence scope keeps personal workspaces isolated from each other and from main workbenches', async () => {
  const {
    normalizePresenceScope,
    shouldRenderPresenceForUser,
  } = await import(moduleUrl)

  assert.equal(normalizePresenceScope('chat'), 'chat')
  assert.equal(normalizePresenceScope('pw-amy'), 'pw:amy')
  assert.equal(normalizePresenceScope('pw-bob'), 'pw:bob')

  assert.equal(
    shouldRenderPresenceForUser({
      currentMode: 'design',
      remoteMode: 'design',
      myUserId: 'me',
      remoteUserId: 'teammate',
      hasCursor: true,
    }),
    true,
  )

  assert.equal(
    shouldRenderPresenceForUser({
      currentMode: 'design',
      remoteMode: 'dev',
      myUserId: 'me',
      remoteUserId: 'teammate',
      hasCursor: true,
    }),
    false,
  )

  assert.equal(
    shouldRenderPresenceForUser({
      currentMode: 'pw-amy',
      remoteMode: 'pw-amy',
      myUserId: 'me',
      remoteUserId: 'teammate',
      hasCursor: true,
    }),
    true,
  )

  assert.equal(
    shouldRenderPresenceForUser({
      currentMode: 'pw-amy',
      remoteMode: 'pw-bob',
      myUserId: 'me',
      remoteUserId: 'teammate',
      hasCursor: true,
    }),
    false,
  )

  assert.equal(
    shouldRenderPresenceForUser({
      currentMode: 'chat',
      remoteMode: 'chat',
      myUserId: 'me',
      remoteUserId: 'me',
      hasCursor: true,
    }),
    false,
  )
})

test('speech bubble stays live while typing, fades after idle, and falls back to the cursor label', async () => {
  const {
    SLASH_FADE_DURATION_MS,
    SLASH_FADE_START_MS,
    SLASH_PLACEHOLDER,
    getSpeechBubbleVisualState,
  } = await import(moduleUrl)

  const baseTs = 10_000

  assert.deepEqual(
    getSpeechBubbleVisualState(null, baseTs),
    {
      bubbleVisible: false,
      done: false,
      fading: false,
      opacity: 0,
      text: '',
    },
  )

  assert.deepEqual(
    getSpeechBubbleVisualState(
      {
        active: true,
        text: '',
        updatedAt: baseTs,
      },
      baseTs + 300,
    ),
    {
      bubbleVisible: true,
      done: false,
      fading: false,
      opacity: 1,
      text: SLASH_PLACEHOLDER,
    },
  )

  const fading = getSpeechBubbleVisualState(
    {
      active: true,
      text: '正在改这个按钮',
      updatedAt: baseTs,
    },
    baseTs + SLASH_FADE_START_MS + Math.floor(SLASH_FADE_DURATION_MS / 2),
  )

  assert.equal(fading.bubbleVisible, true)
  assert.equal(fading.fading, true)
  assert.equal(fading.done, false)
  assert.match(fading.text, /按钮/u)
  assert.equal(fading.opacity < 1, true)
  assert.equal(fading.opacity > 0, true)

  assert.deepEqual(
    getSpeechBubbleVisualState(
      {
        active: true,
        text: '暂停后应该消失',
        updatedAt: baseTs,
      },
      baseTs + SLASH_FADE_START_MS + SLASH_FADE_DURATION_MS + 10,
    ),
    {
      bubbleVisible: false,
      done: true,
      fading: false,
      opacity: 0,
      text: '暂停后应该消失',
    },
  )
})

test('presence layer mutes itself while top-level overlays are open', async () => {
  const { shouldMutePresenceLayer } = await import(moduleUrl)

  assert.equal(shouldMutePresenceLayer({}), false)
  assert.equal(shouldMutePresenceLayer({ settingsOpen: true }), true)
  assert.equal(shouldMutePresenceLayer({ winPanelOpen: true }), true)
  assert.equal(shouldMutePresenceLayer({ sharedInviteOpen: true }), true)
})
