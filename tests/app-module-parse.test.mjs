import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('app module script parses without syntax errors', () => {
  const html = readFileSync(new URL('../public/app.html', import.meta.url), 'utf8')
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/)

  assert.ok(match, 'expected module script in app.html')
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'codelab-app-parse-'))
  const tempFile = path.join(tempDir, 'app-module.mjs')

  writeFileSync(tempFile, match[1], 'utf8')

  const result = spawnSync(process.execPath, ['--check', tempFile], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
})
