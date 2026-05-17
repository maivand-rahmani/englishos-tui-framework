import { describe, it, expect } from 'vitest'
import { normalizeFrame, delay } from '../../test/integration-helpers.js'

describe('integration helpers', () => {
  it('normalizeFrame handles undefined', () => {
    expect(normalizeFrame(undefined)).toBe('')
  })

  it('normalizeFrame strips ANSI codes', () => {
    expect(normalizeFrame('\x1b[32mHello\x1b[0m')).toBe('Hello')
  })

  it('delay resolves', async () => {
    const start = Date.now()
    await delay(10)
    expect(Date.now() - start).toBeGreaterThanOrEqual(5)
  })
})
