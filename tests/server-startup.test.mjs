import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'

import { listenWithFallback } from '../server-startup.js'

function createServer() {
  return http.createServer((_req, res) => {
    res.end('ok')
  })
}

async function closeServer(server) {
  if (!server.listening) return
  await new Promise((resolve, reject) => {
    server.close(error => {
      if (error) reject(error)
      else resolve()
    })
  })
}

test('listenWithFallback moves to the next port when the preferred port is already busy', async () => {
  const blocker = createServer()
  const app = createServer()

  try {
    await new Promise((resolve, reject) => {
      blocker.listen(0, '127.0.0.1', error => {
        if (error) reject(error)
        else resolve()
      })
    })

    const busyPort = blocker.address().port
    const result = await listenWithFallback(app, {
      host: '127.0.0.1',
      port: busyPort,
      maxAttempts: 3,
    })

    assert.equal(result.requestedPort, busyPort)
    assert.equal(result.port, busyPort + 1)
    assert.equal(result.fellBack, true)
    assert.equal(app.address().port, busyPort + 1)
  } finally {
    await closeServer(app)
    await closeServer(blocker)
  }
})
