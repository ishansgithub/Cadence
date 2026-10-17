import { describe, expect, it } from 'vitest'
import {
  bestDay,
  currentStreak,
  dailySeries,
  estimateVsActual,
  goalProgress,
  hourTotals,
  interruptionRates,
  reportRange,
  topReasons,
  weeklyByGoal,
} from './reports'
import type { DailyFocusRow, FocusHourRow, InterruptionRow, TaskFocusRow, TimeByGoalRow } from './types'

const user = '11111111-1111-4111-8111-111111111111'
const goalA = '22222222-2222-4222-8222-222222222222'
const goalB = '33333333-3333-4333-8333-333333333333'

describe('report ranges', () => {
  it('uses the configured week start', () => {
    expect(reportRange('this_week', '2026-03-04', 1)).toEqual({ from: '2026-03-02', to: '2026-03-08' })
    expect(reportRange('this_week', '2026-03-04', 0)).toEqual({ from: '2026-03-01', to: '2026-03-07' })
    expect(reportRange('last_week', '2026-03-04', 1)).toEqual({ from: '2026-02-23', to: '2026-03-01' })
  })

  it('covers the calendar month and the last 30 days', () => {
    expect(reportRange('this_month', '2026-03-04', 1)).toEqual({ from: '2026-03-01', to: '2026-03-31' })
    expect(reportRange('last_30', '2026-03-04', 1)).toEqual({ from: '2026-02-03', to: '2026-03-04' })
  })

  it('keeps a custom range inclusive and ordered', () => {
    expect(reportRange('custom', '2026-03-04', 1, { from: '2026-03-10', to: '2026-03-01' })).toEqual({
      from: '2026-03-01',
      to: '2026-03-10',
    })
  })
})

describe('report shaping', () => {
  const daily: DailyFocusRow[] = [
    { user_id: user, day: '2026-03-02', goal_id: goalA, focus_min: 25, sessions: 1, interrupted_sessions: 0 },
    { user_id: user, day: '2026-03-02', goal_id: null, focus_min: 10, sessions: 1, interrupted_sessions: 1 },
    { user_id: user, day: '2026-03-04', goal_id: goalB, focus_min: 50, sessions: 2, interrupted_sessions: 1 },
  ]

  it('fills missing days and drops untagged sessions when a goal is selected', () => {
    const all = dailySeries(daily, { from: '2026-03-02', to: '2026-03-04' }, null)
    expect(all.map((point) => point.focusMin)).toEqual([35, 0, 50])
    const filtered = dailySeries(daily, { from: '2026-03-02', to: '2026-03-04' }, goalA)
    expect(filtered.map((point) => point.focusMin)).toEqual([25, 0, 0])
  })

  it('stacks weeks by goal', () => {
    const rows: TimeByGoalRow[] = [
      { user_id: user, goal_id: goalA, week_start: '2026-03-02', focus_min: 25 },
      { user_id: user, goal_id: goalB, week_start: '2026-03-02', focus_min: 50 },
    ]
    const stacked = weeklyByGoal(rows, { from: '2026-03-02', to: '2026-03-08' }, null)
    expect(stacked.points).toEqual([{ week: '2026-03-02', [goalA]: 25, [goalB]: 50 }])
    expect(weeklyByGoal(rows, { from: '2026-03-02', to: '2026-03-08' }, goalA).goalIds).toEqual([goalA])
  })

  it('sums completed tasks and interruption rates', () => {
    const tasks: TaskFocusRow[] = [
      {
        user_id: user,
        task_id: '44444444-4444-4444-8444-444444444444',
        goal_id: goalA,
        title: 'Write',
        status: 'done',
        estimate_min: 30,
        day: '2026-03-02',
        actual_min: 20,
      },
      {
        user_id: user,
        task_id: '44444444-4444-4444-8444-444444444444',
        goal_id: goalA,
        title: 'Write',
        status: 'done',
        estimate_min: 30,
        day: '2026-03-03',
        actual_min: 15,
      },
    ]
    expect(estimateVsActual(tasks, { from: '2026-03-02', to: '2026-03-03' }, null)).toEqual([
      { taskId: '44444444-4444-4444-8444-444444444444', title: 'Write', estimateMin: 30, actualMin: 35 },
    ])
    expect(interruptionRates(daily, { from: '2026-03-02', to: '2026-03-04' }, null)).toEqual([
      { day: '2026-03-02', rate: 0.5 },
      { day: '2026-03-04', rate: 0.5 },
    ])
  })

  it('totals reasons and hours', () => {
    const reasons: InterruptionRow[] = [
      { user_id: user, goal_id: null, day: '2026-03-02', reason: 'Distracted', interruptions: 2 },
      { user_id: user, goal_id: goalA, day: '2026-03-04', reason: 'Distracted', interruptions: 1 },
    ]
    expect(topReasons(reasons, { from: '2026-03-01', to: '2026-03-31' }, null)[0]).toEqual({
      reason: 'Distracted',
      interruptions: 3,
    })
    const hours: FocusHourRow[] = [
      { user_id: user, goal_id: null, day: '2026-03-02', hour: 9, focus_min: 25 },
      { user_id: user, goal_id: goalA, day: '2026-03-02', hour: 9, focus_min: 10 },
    ]
    const totals = hourTotals(hours, { from: '2026-03-02', to: '2026-03-02' }, null)
    expect(totals[9]).toBe(35)
    expect(hourTotals(hours, { from: '2026-03-02', to: '2026-03-02' }, goalA)[9]).toBe(10)
  })

  it('counts the current streak back from today or yesterday', () => {
    expect(currentStreak(daily, '2026-03-04')).toBe(1)
    expect(currentStreak(daily, '2026-03-05')).toBe(1)
    expect(currentStreak(daily, '2026-03-07')).toBe(0)
    expect(bestDay(dailySeries(daily, { from: '2026-03-02', to: '2026-03-04' }, null))?.day).toBe('2026-03-04')
  })
})

describe('goal progress', () => {
  it('compares focus hours with the target and counts days left', () => {
    expect(
      goalProgress(
        { target_type: 'hours_per_week', target_value: 10, deadline: null, created_at: '2026-03-01T00:00:00Z' },
        300,
        '2026-03-04',
      ),
    ).toEqual({ progress: 0.5, label: '5 / 10 h this week' })
    expect(
      goalProgress(
        { target_type: 'deadline', target_value: null, deadline: '2026-03-11', created_at: '2026-03-01T00:00:00Z' },
        0,
        '2026-03-04',
      ),
    ).toEqual({ progress: 0.3, label: '7 days left' })
  })
})