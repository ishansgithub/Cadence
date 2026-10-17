import { describe, expect, it } from 'vitest'
import { appName } from './index'

describe('appName', () => {
  it('is Cadence', () => {
    expect(appName).toBe('Cadence')
  })
})
