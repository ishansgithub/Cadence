import { describe, expect, it } from 'vitest'
import { sanitizeReturnPath } from './redirect'

describe('sanitizeReturnPath', () => {
  it('sends missing or external targets to Today', () => {
    expect(sanitizeReturnPath(undefined)).toBe('/today')
    expect(sanitizeReturnPath('https://example.com')).toBe('/today')
    expect(sanitizeReturnPath('//example.com')).toBe('/today')
    expect(sanitizeReturnPath('/login')).toBe('/today')
    expect(sanitizeReturnPath('/not-a-page')).toBe('/today')
  })

  it('keeps the page the user originally requested', () => {
    expect(sanitizeReturnPath('/tasks')).toBe('/tasks')
    expect(sanitizeReturnPath('/reports?week=1')).toBe('/reports?week=1')
    expect(sanitizeReturnPath('/settings#account')).toBe('/settings#account')
  })
})
