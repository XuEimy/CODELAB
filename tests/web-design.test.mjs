import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const projectRoot = path.resolve(import.meta.dirname, '..')
const appPath = path.join(projectRoot, 'public', 'app.html')
const modulePath = path.join(projectRoot, 'public', 'design-workbench.js')

test('web design tokens can be customized and written back into the current html game shell', async () => {
  const moduleUrl = pathToFileURL(modulePath).href
  const {
    applyDesignStudioStateToCode,
    createDesignStudioState,
    reduceDesignStudioState,
  } = await import(moduleUrl)

  const html = fs.readFileSync(appPath, 'utf8')
  const snakeCode = html.match(/const SNAKE_CODE=`([\s\S]*?)`\n<\/script>/)?.[1]
  assert.equal(typeof snakeCode, 'string')

  let state = createDesignStudioState(snakeCode, [])
  state = reduceDesignStudioState(state, { type: 'set-schema', schemaId: 'web-ui' })
  state = reduceDesignStudioState(state, { type: 'set-web-field', key: 'pageBg', value: '#f6f0e8' })
  state = reduceDesignStudioState(state, { type: 'set-web-field', key: 'hudGap', value: 36 })
  state = reduceDesignStudioState(state, { type: 'set-web-field', key: 'canvasRadius', value: 16 })
  state = reduceDesignStudioState(state, { type: 'set-web-field', key: 'hintColor', value: '#7a5c44' })

  const updated = applyDesignStudioStateToCode(snakeCode, state)

  assert.match(updated, /body\{background:#f6f0e8/u)
  assert.match(updated, /#hud\{margin-bottom:\d+px;display:flex;align-items:center;gap:36px/u)
  assert.match(updated, /canvas\{border:1px solid #[0-9a-fA-F]{6};box-shadow:[^}]*;border-radius:16px/u)
  assert.match(updated, /#hint\{margin-top:\d+px;font-size:\d+px;color:#7a5c44/u)
})
