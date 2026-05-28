import test from 'node:test'
import assert from 'node:assert/strict'

import { highlightCode, escapeHtml } from '../public/editor-highlight.js'

test('escapeHtml safely escapes raw markup', () => {
  assert.equal(escapeHtml('<div class="app">"&"</div>'), '&lt;div class=&quot;app&quot;&gt;&quot;&amp;&quot;&lt;/div&gt;')
})

test('highlightCode decorates html tokens', () => {
  const html = highlightCode('<div class="hud">Play</div>', 'html')

  assert.match(html, /tok-tag/)
  assert.match(html, /tok-attr/)
  assert.match(html, /tok-string/)
})

test('highlightCode decorates css tokens', () => {
  const css = highlightCode('.hud { color: #fff; }', 'css')

  assert.match(css, /tok-selector/)
  assert.match(css, /tok-prop/)
  assert.match(css, /tok-value/)
})

test('highlightCode decorates javascript tokens', () => {
  const js = highlightCode('function boot() { const score = 42; return "ok" }', 'javascript')

  assert.match(js, /tok-keyword/)
  assert.match(js, /tok-fn/)
  assert.match(js, /tok-number/)
  assert.match(js, /tok-string/)
})
