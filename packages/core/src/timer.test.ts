import { describe, expect, it } from 'vitest'
import { autoCompleteEnd, isExpired, nextSessionType, remainingSeconds } from './timer'

const session = {
  planned_min: 25,
  started_at: '2026-03-01T00:00:00.000Z',
}

describe('remainingSeconds', () => {
  it('counts down from the start timestamp', () => {
    expect(remainingSeconds(session, new Date('2026-03-01T00:10:00.000Z'))).toBe(15 * 60)
  })

  it('is zero at the planned end and negative after it', () => {
    expect(remainingSeconds(session, new Date('2026-03-01T00:25:00.000Z'))).toBe(0)
    expect(remainingSeconds(session, new Date('2026-03-01T00:26:00.000Z'))).toBe(-60)
  })
})

describe('isExpired', () => {
  it('is true once the planned duration has elapsed', () => {
    expect(isExpired(session, new Date('2026-03-01T00:24:59.000Z'))).toBe(false)
    expect(isExpired(session, new Date('2026-03-01T00:25:00.000Z'))).toBe(true)
  })
})

describe('autoCompleteEnd', () => {
  it('ends the session at started_at plus planned minutes', () => {
    expect(autoCompleteEnd(session)).toBe('2026-03-01T00:25:00.000Z')
  })
})

describe('nextSessionType', () => {
  const settings = { sessions_before_long_break: 4 }

  it('uses a long break on each multiple of the focus cycle', () => {
    expect(nextSessionType(4, settings)).toBe('long_break')
    expect(nextSessionType(8, settings)).toBe('long_break')
  })

  it('uses a short break otherwise', () => {
    expect(nextSessionType(0, settings)).toBe('short_break')
    expect(nextSessionType(3, settings)).toBe('short_break')
  })
})
