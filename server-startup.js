function normalizePort(port) {
  const value = Number(port)
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new TypeError(`Invalid port: ${port}`)
  }
  return value
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    const handleError = error => {
      cleanup()
      reject(error)
    }

    const handleListening = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      server.off('error', handleError)
      server.off('listening', handleListening)
    }

    server.once('error', handleError)
    server.once('listening', handleListening)
    server.listen(port, host)
  })
}

export async function listenWithFallback(server, options = {}) {
  const host = options.host || '0.0.0.0'
  const maxAttempts = Number.isInteger(options.maxAttempts) ? options.maxAttempts : 10
  const requestedPort = normalizePort(options.port ?? 3000)
  let port = requestedPort

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await listen(server, host, port)
      const address = server.address()

      return {
        requestedPort,
        port: typeof address === 'object' && address ? address.port : port,
        fellBack: port !== requestedPort,
      }
    } catch (error) {
      if (error?.code !== 'EADDRINUSE' || attempt === maxAttempts) {
        throw error
      }

      const nextPort = port + 1
      options.onRetry?.({
        attempt,
        requestedPort,
        attemptedPort: port,
        nextPort,
        error,
      })
      port = nextPort
    }
  }

  throw new Error('Unable to bind server to an available port')
}
