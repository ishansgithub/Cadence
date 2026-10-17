import { describe, expect, it } from 'vitest'
import { addCalendarDays, todayInTimeZone } from './dates'

describe('todayInTimeZone', () => {
  it('uses the calendar date in that timezone, not UTC', () => {
    expect(todayInTimeZone('America/New_York', new Date('2026-03-04T03:30:00.000Z'))).toBe('2026-03-03')
    expect(todayInTimeZone('Asia/Kolkata', new Date('2026-03-04T20:00:00.000Z'))).toBe('2026-03-05')
  })
})

describe('addCalendarDays', () => {
  it('moves across month and leap-day boundaries', () => {
    expect(addCalendarDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29')
  })
})
