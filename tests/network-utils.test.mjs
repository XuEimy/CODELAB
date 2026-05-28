import test from 'node:test'
import assert from 'node:assert/strict'

import {
  choosePreferredBase,
  collectLanIPv4Addresses,
  isLoopbackHost,
} from '../network-utils.js'

test('isLoopbackHost detects localhost variants', () => {
  assert.equal(isLoopbackHost('localhost'), true)
  assert.equal(isLoopbackHost('127.0.0.1'), true)
  assert.equal(isLoopbackHost('::1'), true)
  assert.equal(isLoopbackHost('192.168.43.7'), false)
})

test('collectLanIPv4Addresses returns private IPv4 addresses only', () => {
  const interfaces = {
    lo0: [
      { address: '127.0.0.1', family: 'IPv4', internal: true },
      { address: '::1', family: 'IPv6', internal: true },
    ],
    en0: [
      { address: '192.168.43.7', family: 'IPv4', internal: false },
      { address: 'fe80::1', family: 'IPv6', internal: false },
    ],
    en1: [
      { address: '10.0.0.12', family: 'IPv4', internal: false },
      { address: '8.8.8.8', family: 'IPv4', internal: false },
    ],
  }

  assert.deepEqual(collectLanIPv4Addresses(interfaces), ['10.0.0.12', '192.168.43.7'])
})

test('choosePreferredBase prefers request origin when already using LAN IP', () => {
  const base = choosePreferredBase({
    protocol: 'http',
    hostname: '192.168.43.7',
    port: '3000',
    interfaces: {
      en0: [{ address: '192.168.43.7', family: 'IPv4', internal: false }],
    },
  })

  assert.equal(base, 'http://192.168.43.7:3000')
})

test('choosePreferredBase upgrades localhost origin to LAN IP when available', () => {
  const base = choosePreferredBase({
    protocol: 'http',
    hostname: 'localhost',
    port: '3000',
    interfaces: {
      en0: [{ address: '192.168.43.7', family: 'IPv4', internal: false }],
    },
  })

  assert.equal(base, 'http://192.168.43.7:3000')
})

test('choosePreferredBase falls back to request origin when no LAN IP exists', () => {
  const base = choosePreferredBase({
    protocol: 'http',
    hostname: 'localhost',
    port: '3000',
    interfaces: {
      lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
    },
  })

  assert.equal(base, 'http://localhost:3000')
})
