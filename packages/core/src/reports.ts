import { addCalendarDays } from './dates'
import type { DailyFocusRow, FocusHourRow, Goal, InterruptionRow, TaskFocusRow, TimeByGoalRow } from './types'

export type ReportPreset = 'this_week' | 'last_week' | 'this_month' | 'last_30' | 'custom'

export type DateRange = { from: string; to: string }

export function weekStartOn(isoDate: string, weekStartsOn: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const delta = (dow - weekStartsOn + 7) % 7
  return addCalendarDays(isoDate, -delta)
}

function monthBounds(isoDate: string): DateRange {
  const [year, month] = isoDate.split('-').map(Number)
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return { from: `${prefix}-01`, to: `${prefix}-${String(last).padStart(2, '0')}` }
}

export function reportRange(
  preset: ReportPreset,
  today: string,
  weekStartsOn: number,
  custom?: DateRange,
): DateRange {
  if (preset === 'custom') {
    const from = custom?.from || today
    const to = custom?.to || today
    return from <= to ? { from, to } : { from: to, to: from }
  }
  if (preset === 'this_month') return monthBounds(today)
  if (preset === 'last_30') return { from: addCalendarDays(today, -29), to: today }
  const start = weekStartOn(today, weekStartsOn)
  if (preset === 'last_week') {
    const from = addCalendarDays(start, -7)
    return { from, to: addCalendarDays(from, 6) }
  }
  return { from: start, to: addCalendarDays(start, 6) }
}

export function eachDay(from: string, to: string): string[] {
  const days: string[] = []
  let cursor = from
  while (cursor <= to && days.length < 400) {
    days.push(cursor)
    cursor = addCalendarDays(cursor, 1)
  }
  return days
}

function inRange(day: string, range: DateRange): boolean {
  return day >= range.from && day <= range.to
}

function matchesGoal(goalId: string | null | undefined, selected: string | null): boolean {
  return selected == null || goalId === selected
}

export type DailyPoint = { day: string; focusMin: number; sessions: number; interrupted: number }

export function dailySeries(
  rows: DailyFocusRow[],
  range: DateRange,
  goalId: string | null,
): DailyPoint[] {
  const totals = new Map<string, DailyPoint>()
  for (const row of rows) {
    if (!inRange(row.day, range) || !matchesGoal(row.goal_id, goalId)) continue
    const current = totals.get(row.day) ?? { day: row.day, focusMin: 0, sessions: 0, interrupted: 0 }
    current.focusMin += row.focus_min
    current.sessions += row.sessions
    current.interrupted += row.interrupted_sessions
    totals.set(row.day, current)
  }
  return eachDay(range.from, range.to).map(
    (day) => totals.get(day) ?? { day, focusMin: 0, sessions: 0, interrupted: 0 },
  )
}

export type WeeklyPoint = { week: string } & Record<string, number | string>

export function weeklyByGoal(
  rows: TimeByGoalRow[],
  range: DateRange,
  goalId: string | null,
): { points: WeeklyPoint[]; goalIds: string[] } {
  const points = new Map<string, WeeklyPoint>()
  const goalIds = new Set<string>()
  for (const row of rows) {
    if (!matchesGoal(row.goal_id, goalId)) continue
    const weekEnd = addCalendarDays(row.week_start, 6)
    if (row.week_start > range.to || weekEnd < range.from) continue
    const key = row.goal_id ?? 'none'
    goalIds.add(key)
    const point = points.get(row.week_start) ?? { week: row.week_start }
    point[key] = Number(point[key] ?? 0) + row.focus_min
    points.set(row.week_start, point)
  }
  return {
    points: [...points.values()].sort((a, b) => a.week.localeCompare(b.week)),
    goalIds: [...goalIds],
  }
}

export type EstimatePoint = { taskId: string; title: string; estimateMin: number; actualMin: number }

export function estimateVsActual(
  rows: TaskFocusRow[],
  range: DateRange,
  goalId: string | null,
): EstimatePoint[] {
  const totals = new Map<string, EstimatePoint>()
  for (const row of rows) {
    if (row.status !== 'done' || !inRange(row.day, range) || !matchesGoal(row.goal_id, goalId)) continue
    const current = totals.get(row.task_id) ?? {
      taskId: row.task_id,
      title: row.title,
      estimateMin: row.estimate_min ?? 0,
      actualMin: 0,
    }
    current.actualMin += row.actual_min
    totals.set(row.task_id, current)
  }
  return [...totals.values()].sort((a, b) => b.actualMin - a.actualMin)
}

export type RatePoint = { day: string; rate: number }

export function interruptionRates(rows: DailyFocusRow[], range: DateRange, goalId: string | null): RatePoint[] {
  return dailySeries(rows, range, goalId)
    .filter((point) => point.sessions > 0)
    .map((point) => ({ day: point.day, rate: point.interrupted / point.sessions }))
}

export type ReasonPoint = { reason: string; interruptions: number }

export function topReasons(rows: InterruptionRow[], range: DateRange, goalId: string | null): ReasonPoint[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    if (!inRange(row.day, range) || !matchesGoal(row.goal_id, goalId)) continue
    totals.set(row.reason, (totals.get(row.reason) ?? 0) + row.interruptions)
  }
  return [...totals.entries()]
    .map(([reason, interruptions]) => ({ reason, interruptions }))
    .sort((a, b) => b.interruptions - a.interruptions)
}

export function hourTotals(rows: FocusHourRow[], range: DateRange, goalId: string | null): number[] {
  const hours = Array.from({ length: 24 }, () => 0)
  for (const row of rows) {
    if (!inRange(row.day, range) || !matchesGoal(row.goal_id, goalId)) continue
    if (row.hour >= 0 && row.hour <= 23) hours[row.hour] += row.focus_min
  }
  return hours
}

export function currentStreak(rows: DailyFocusRow[], today: string): number {
  const active = new Set(rows.filter((row) => row.sessions > 0).map((row) => row.day))
  let cursor = active.has(today) ? today : addCalendarDays(today, -1)
  if (!active.has(cursor)) return 0
  let streak = 0
  while (active.has(cursor)) {
    streak += 1
    cursor = addCalendarDays(cursor, -1)
  }
  return streak
}

export function bestDay(points: DailyPoint[]): DailyPoint | null {
  const withFocus = points.filter((point) => point.focusMin > 0)
  if (withFocus.length === 0) return null
  return withFocus.reduce((best, point) => (point.focusMin > best.focusMin ? point : best))
}

export function goalFocusMinutes(rows: TimeByGoalRow[], goalId: string, week: string | null): number {
  return rows
    .filter((row) => row.goal_id === goalId && (week == null || row.week_start === week))
    .reduce((sum, row) => sum + row.focus_min, 0)
}

function calendarDay(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  const start = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const end = Date.UTC(toYear, toMonth - 1, toDay)
  return Math.round((end - start) / 86_400_000)
}

export function goalProgress(
  goal: Pick<Goal, 'target_type' | 'target_value' | 'deadline' | 'created_at'>,
  focusMinutes: number,
  today: string,
): { progress: number; label: string } {
  const focusHours = focusMinutes / 60
  if (goal.target_type === 'hours_per_week' || goal.target_type === 'total_hours') {
    const target = goal.target_value ?? 0
    const progress = target > 0 ? Math.min(1, focusHours / target) : 0
    const shown = Math.round(focusHours * 10) / 10
    const suffix = goal.target_type === 'hours_per_week' ? 'this week' : 'total'
    return { progress, label: target > 0 ? `${shown} / ${target} h ${suffix}` : 'No hour target' }
  }
  if (goal.target_type === 'deadline' && goal.deadline) {
    const start = calendarDay(goal.created_at)
    const span = Math.max(1, daysBetween(start, goal.deadline))
    const elapsed = daysBetween(start, today)
    const left = daysBetween(today, goal.deadline)
    const label = left > 1 ? `${left} days left` : left === 1 ? '1 day left' : left === 0 ? 'Due today' : 'Past deadline'
    return { progress: Math.min(1, Math.max(0, elapsed / span)), label }
  }
  return { progress: 0, label: 'No target' }
}
