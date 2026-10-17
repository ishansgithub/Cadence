import { describe, expect, it } from 'vitest'
import { resolveTimeZone } from './time-zone'

describe('resolveTimeZone', () => {
  it('keeps a real IANA name', () => {
    expect(resolveTimeZone('Asia/Kolkata')).toBe('Asia/Kolkata')
  })

  it('falls back when the runtime has no time zone', () => {
    expect(resolveTimeZone(undefined)).toBe('UTC')
    expect(resolveTimeZone('   ')).toBe('UTC')
  })
})
