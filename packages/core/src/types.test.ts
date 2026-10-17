import { describe, expect, it } from 'vitest'
import { settingsSchema } from './types'

const validSettings = {
  user_id: '11111111-1111-4111-8111-111111111111',
  focus_min: 25,
  short_break_min: 5,
  long_break_min: 15,
  sessions_before_long_break: 4,
  week_starts_on: 1,
  timezone: 'Asia/Kolkata',
  sound_enabled: true,
  notifications_enabled: true,
  updated_at: '2026-10-17T07:00:00.000Z',
}

describe('settingsSchema', () => {
  it('accepts a settings row', () => {
    expect(settingsSchema.parse(validSettings)).toEqual(validSettings)
  })

  it('rejects a row without a user id', () => {
    const rest: Record<string, unknown> = { ...validSettings }
    delete rest.user_id
    expect(settingsSchema.safeParse(rest).success).toBe(false)
  })
})
