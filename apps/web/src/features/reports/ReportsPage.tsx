import {
  bestDay,
  currentStreak,
  dailyInsight,
  dailySeries,
  estimateInsight,
  estimateVsActual,
  goalTimeInsight,
  hourInsight,
  hourTotals,
  reasonInsight,
  reportRange,
  todayInTimeZone,
  topReasons,
  weeklyByGoal,
  type ReportPreset,
  type ReportRows,
} from '@cadence/core'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useGoals } from '../../data/use-goals'
import { useReports } from '../../data/use-reports'
import { useSettings } from '../settings/useSettings'
import { ChartCard, DataTable } from './ChartCard'

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']

function shortDay(day: string): string {
  return day.slice(5)
}

export function ReportsPage() {
  const reports = useReports()
  const goals = useGoals()
  const settings = useSettings()
  const [span, setSpan] = useState<'week' | 'month'>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [goalId, setGoalId] = useState<string | null>(null)

  const timeZone = settings.settings?.timezone ?? 'UTC'
  const weekStartsOn = settings.settings?.week_starts_on ?? 1
  const today = todayInTimeZone(timeZone, new Date())
  const usingCustom = Boolean(customFrom || customTo)
  const preset: ReportPreset = usingCustom ? 'custom' : span === 'week' ? 'this_week' : 'this_month'
  const range = reportRange(preset, today, weekStartsOn, {
    from: customFrom || today,
    to: customTo || today,
  })

  const rows: ReportRows | undefined = reports.data
  const goalName = useMemo(() => {
    const map = new Map((goals.data ?? []).map((goal) => [goal.id, goal.title]))
    map.set('none', 'No goal')
    return map
  }, [goals.data])

  const daily = rows ? dailySeries(rows.daily, range, goalId) : []
  const weekly = rows ? weeklyByGoal(rows.timeByGoal, range, goalId) : { points: [], goalIds: [] }
  const estimates = rows ? estimateVsActual(rows.taskFocus, range, goalId) : []
  const reasons = rows ? topReasons(rows.interruptions, range, goalId) : []
  const hours = rows ? hourTotals(rows.hours, range, goalId) : Array.from({ length: 24 }, () => 0)
  const streak = rows ? currentStreak(rows.daily, today) : 0
  const best = bestDay(daily)
  const focusMin = Math.round(daily.reduce((sum, point) => sum + point.focusMin, 0))
  const sessions = daily.reduce((sum, point) => sum + point.sessions, 0)
  const selectedName = goalId ? (goalName.get(goalId) ?? 'Goal') : null
  const retry = () => {
    void reports.refetch()
  }

  const hourRows = hours.map((minutes, hour) => [
    `${String(hour).padStart(2, '0')}:00`,
    Math.round(minutes),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="tabular-nums">
              {range.from} → {range.to}
            </span>
            <span className="mx-2">·</span>
            <span>{timeZone}</span>
          </p>
        </div>
        {selectedName ? (
          <button
            type="button"
            onClick={() => setGoalId(null)}
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
          >
            Clear {selectedName}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div
          role="group"
          aria-label="Range span"
          className="flex rounded-xl border border-border bg-surface p-1"
        >
          {(['week', 'month'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={span === option && !usingCustom}
              onClick={() => {
                setSpan(option)
                setCustomFrom('')
                setCustomTo('')
              }}
              className={`min-h-11 rounded-lg px-4 text-sm font-medium capitalize ${
                span === option && !usingCustom
                  ? 'bg-accent-muted text-accent'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="text-sm font-medium">
          From
          <input
            type="date"
            value={customFrom || range.from}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="mt-1 block min-h-11 rounded-lg border border-border bg-surface px-3 tabular-nums"
          />
        </label>
        <label className="text-sm font-medium">
          To
          <input
            type="date"
            value={customTo || range.to}
            onChange={(event) => setCustomTo(event.target.value)}
            className="mt-1 block min-h-11 rounded-lg border border-border bg-surface px-3 tabular-nums"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Focus minutes" value={String(focusMin)} />
        <Summary label="Focus sessions" value={String(sessions)} testId="focus-sessions" />
        <Summary label="Current streak" value={streak === 1 ? '1 day' : `${streak} days`} />
        <Summary
          label="Best day"
          value={best ? `${shortDay(best.day)} · ${Math.round(best.focusMin)} min` : '—'}
        />
      </div>

      <ChartCard
        title="Focus time per day"
        insight={dailyInsight(daily)}
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={!reports.isPending && !reports.error && sessions === 0}
        table={
          <DataTable
            caption="Focus minutes by day"
            columns={['Day', 'Minutes', 'Sessions']}
            rows={daily.map((point) => [point.day, Math.round(point.focusMin), point.sessions])}
          />
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily.map((point) => ({ ...point, label: shortDay(point.day) }))}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
              <YAxis stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
              <Tooltip />
              <Bar dataKey="focusMin" name="Minutes" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Time by goal"
        insight={goalTimeInsight(weekly.points, weekly.goalIds, goalName)}
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={weekly.points.length === 0 || weekly.goalIds.every((id) =>
          weekly.points.every((point) => !Number(point[id])),
        )}
        table={
          <DataTable
            caption="Focus minutes by week and goal"
            columns={['Week', ...weekly.goalIds.map((id) => goalName.get(id) ?? id)]}
            rows={weekly.points.map((point) => [
              String(point.week),
              ...weekly.goalIds.map((id) => Math.round(Number(point[id] ?? 0))),
            ])}
          />
        }
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly.points}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="week"
                tickFormatter={shortDay}
                stroke="var(--chart-axis)"
                tick={{ fill: 'var(--chart-axis)' }}
              />
              <YAxis stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
              <Tooltip />
              <Legend
                onClick={(item) => {
                  if (typeof item.dataKey === 'string' && item.dataKey !== 'none') setGoalId(item.dataKey)
                }}
              />
              {weekly.goalIds.map((id, index) => (
                <Bar
                  key={id}
                  dataKey={id}
                  name={goalName.get(id) ?? 'Goal'}
                  stackId="focus"
                  fill={chartColors[index % chartColors.length]}
                  className="cursor-pointer"
                  onClick={() => {
                    if (id !== 'none') setGoalId(id)
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Estimate vs actual"
        insight={estimateInsight(estimates)}
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={estimates.length === 0}
        table={
          <DataTable
            caption="Estimate versus actual minutes"
            columns={['Task', 'Estimate', 'Actual']}
            rows={estimates.map((point) => [
              point.title,
              Math.round(point.estimateMin),
              Math.round(point.actualMin),
            ])}
          />
        }
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estimates}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="title" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
              <YAxis stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="estimateMin" name="Estimate" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actualMin" name="Actual" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Interruptions by reason"
        insight={reasonInsight(reasons)}
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={reasons.length === 0}
        table={
          <DataTable
            caption="Interruptions by reason"
            columns={['Reason', 'Count']}
            rows={reasons.map((point) => [point.reason, point.interruptions])}
          />
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reasons} layout="vertical">
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--chart-axis)" tick={{ fill: 'var(--chart-axis)' }} />
              <YAxis
                type="category"
                dataKey="reason"
                width={120}
                stroke="var(--chart-axis)"
                tick={{ fill: 'var(--chart-axis)' }}
              />
              <Tooltip />
              <Bar dataKey="interruptions" name="Interruptions" fill="var(--chart-4)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Hour of day"
        insight={hourInsight(hours)}
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={hours.every((value) => value === 0)}
        table={<DataTable caption="Focus minutes by hour" columns={['Hour', 'Minutes']} rows={hourRows} />}
      >
        <Heatmap hours={hours} />
      </ChartCard>
    </div>
  )
}

function Summary({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums" data-testid={testId}>
        {value}
      </p>
    </section>
  )
}

function Heatmap({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 0)
  return (
    <div className="grid grid-cols-6 gap-1 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-[repeat(24,minmax(0,1fr))]">
      {hours.map((minutes, hour) => {
        const strength = max > 0 ? minutes / max : 0
        return (
          <div key={hour} className="min-w-0 text-center">
            <div
              title={`${String(hour).padStart(2, '0')}:00 · ${Math.round(minutes)} min`}
              className="h-10 rounded-md border border-border"
              style={{
                backgroundColor: `color-mix(in srgb, var(--chart-1) ${Math.round(12 + strength * 88)}%, transparent)`,
              }}
            />
            <p className="mt-1 text-[10px] tabular-nums text-muted">{hour}</p>
          </div>
        )
      })}
    </div>
  )
}
