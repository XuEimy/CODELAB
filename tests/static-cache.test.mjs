import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const serverPath = path.resolve(import.meta.dirname, '..', 'server.js')

test('server disables long-lived cache headers for local static previews', () => {
  const source = fs.readFileSync(serverPath, 'utf8')

  assert.match(source, /express\.static/u)
  assert.match(source, /Cache-Control'\s*,\s*'no-store/u)
  assert.doesNotMatch(source, /maxAge:\s*'1h'/u)
})
