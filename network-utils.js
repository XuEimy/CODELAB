export function isLoopbackHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isPrivateIPv4(address) {
  if (typeof address !== 'string') return false
  if (address.startsWith('10.')) return true
  if (address.startsWith('192.168.')) return true

  const match = address.match(/^172\.(\d{1,3})\./)
  if (!match) return false

  const secondOctet = Number(match[1])
  return secondOctet >= 16 && secondOctet <= 31
}

export function collectLanIPv4Addresses(interfaces) {
  const addresses = []

  for (const entries of Object.values(interfaces || {})) {
    for (const entry of entries || []) {
      const family = typeof entry.family === 'string' ? entry.family : String(entry.family)
      if (entry.internal || family !== 'IPv4') continue
      if (!isPrivateIPv4(entry.address)) continue
      addresses.push(entry.address)
    }
  }

  return [...new Set(addresses)].sort()
}

export function choosePreferredBase({ protocol = 'http', hostname, port, interfaces }) {
  const normalizedProtocol = protocol === 'https' ? 'https' : 'http'
  const normalizedPort = port ? String(port) : '3000'
  const lanAddresses = collectLanIPv4Addresses(interfaces)

  if (hostname && !isLoopbackHost(hostname) && hostname !== '0.0.0.0' && hostname !== '::') {
    return `${normalizedProtocol}://${hostname}:${normalizedPort}`
  }

  if (lanAddresses.length > 0) {
    return `${normalizedProtocol}://${lanAddresses[0]}:${normalizedPort}`
  }

  return `${normalizedProtocol}://${hostname || 'localhost'}:${normalizedPort}`
}
