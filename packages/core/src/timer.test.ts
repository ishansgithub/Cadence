import { describe, expect, it } from 'vitest'
import {
  applyPause,
  applyResume,
  autoCompleteEnd,
  cycleProgress,
  isExpired,
  nextSessionType,
  remainingSeconds,
} from './timer'

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

  it('freezes while paused and excludes paused time after resume', () => {
    const paused = { pausedMs: 0, pausedAt: '2026-03-01T00:05:00.000Z' }
    expect(remainingSeconds(session, new Date('2026-03-01T00:08:00.000Z'), paused)).toBe(20 * 60)
    const resumed = applyResume(paused, new Date('2026-03-01T00:08:00.000Z'))
    // 10m wall − 3m pause = 7m elapsed → 18m left
    expect(remainingSeconds(session, new Date('2026-03-01T00:10:00.000Z'), resumed)).toBe(18 * 60)
  })
})

describe('isExpired', () => {
  it('is true once the planned duration has elapsed', () => {
    expect(isExpired(session, new Date('2026-03-01T00:24:59.000Z'))).toBe(false)
    expect(isExpired(session, new Date('2026-03-01T00:25:00.000Z'))).toBe(true)
  })

  it('is never expired while paused', () => {
    expect(
      isExpired(session, new Date('2026-03-01T01:00:00.000Z'), {
        pausedMs: 0,
        pausedAt: '2026-03-01T00:05:00.000Z',
      }),
    ).toBe(false)
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

describe('cycleProgress', () => {
  it('tracks focus sessions toward the long break', () => {
    expect(cycleProgress(0, 4, 'focus')).toEqual({ filled: 0, total: 4 })
    expect(cycleProgress(3, 4, 'focus')).toEqual({ filled: 3, total: 4 })
    expect(cycleProgress(4, 4, 'long_break')).toEqual({ filled: 4, total: 4 })
    expect(cycleProgress(4, 4, 'focus')).toEqual({ filled: 0, total: 4 })
  })
})

describe('applyPause/applyResume', () => {
  it('accumulates pause duration', () => {
    const paused = applyPause({ pausedMs: 0, pausedAt: null }, new Date('2026-03-01T00:05:00.000Z'))
    expect(paused.pausedAt).toBe('2026-03-01T00:05:00.000Z')
    const resumed = applyResume(paused, new Date('2026-03-01T00:07:00.000Z'))
    expect(resumed).toEqual({ pausedMs: 120_000, pausedAt: null })
  })
})
