import {
  addCalendarDays,
  dailySeries,
  weekStartOn,
  type DailyFocusRow,
} from '@cadence/core'
import type { HeatCell } from '../../components/ui/Heatmap'

export function formatMinutes(minutes: number) {
  const total = Math.round(minutes)
  if (total < 60) return `${total}m`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function goalHeatCells(
  daily: DailyFocusRow[],
  goalId: string | null,
  today: string,
  weekStartsOn: number,
  weeks: number,
): HeatCell[] {
  const start = addCalendarDays(weekStartOn(today, weekStartsOn), -(weeks - 1) * 7)
  const end = addCalendarDays(start, weeks * 7 - 1)
  const series = dailySeries(daily, { from: start, to: end }, goalId)
  const byDay = new Map(series.map((point) => [point.day, point.focusMin]))
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const day = addCalendarDays(start, index)
    const minutes = day > today ? 0 : (byDay.get(day) ?? 0)
    return {
      key: day,
      value: minutes,
      label: day > today ? day : `${day}: ${minutes > 0 ? formatMinutes(minutes) : 'no focus'}`,
    }
  })
}
