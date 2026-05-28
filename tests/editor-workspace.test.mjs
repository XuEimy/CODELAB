import test from 'node:test'
import assert from 'node:assert/strict'

import {
  bundleWorkspaceFiles,
  createWorkspaceFromHtml,
  getLanguageFromPath,
} from '../public/editor-workspace.js'

const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Demo</title>
  <style>
    body { background:#111; color:#fff; }
    .hud { display:flex; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const score = 42
    function boot() {
      console.log(score)
    }
    boot()
  </script>
</body>
</html>`

test('createWorkspaceFromHtml splits standalone html into logical files', () => {
  const workspace = createWorkspaceFromHtml(sampleHtml)

  assert.deepEqual(
    workspace.files.map(file => file.path),
    ['index.html', 'styles/game.css', 'scripts/game.js'],
  )

  assert.match(workspace.files[0].content, /<link rel="stylesheet" href="\.\/styles\/game\.css">/)
  assert.match(workspace.files[0].content, /<script type="module" src="\.\/scripts\/game\.js"><\/script>/)
  assert.match(workspace.files[1].content, /background:#111/)
  assert.match(workspace.files[2].content, /const score = 42/)
})

test('bundleWorkspaceFiles rebuilds runnable html from logical files', () => {
  const workspace = createWorkspaceFromHtml(sampleHtml)
  const bundled = bundleWorkspaceFiles(workspace.files)

  assert.match(bundled, /<style>[\s\S]*body \{ background:#111; color:#fff; \}/)
  assert.match(bundled, /<script>[\s\S]*const score = 42/)
  assert.doesNotMatch(bundled, /href="\.\/styles\/game\.css"/)
  assert.doesNotMatch(bundled, /src="\.\/scripts\/game\.js"/)
})

test('getLanguageFromPath infers language from logical file path', () => {
  assert.equal(getLanguageFromPath('index.html'), 'html')
  assert.equal(getLanguageFromPath('styles/game.css'), 'css')
  assert.equal(getLanguageFromPath('scripts/game.js'), 'javascript')
  assert.equal(getLanguageFromPath('engine/core.ts'), 'javascript')
})
