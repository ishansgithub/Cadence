import {
  bestDay,
  currentStreak,
  dailySeries,
  estimateVsActual,
  hourTotals,
  interruptionRates,
  reportRange,
  todayInTimeZone,
  topReasons,
  weeklyByGoal,
  type ReportPreset,
  type ReportRows,
} from '@cadence/core'
import { useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../../components/EmptyState'
import { QueryState } from '../../components/QueryState'
import { useGoals } from '../../data/use-goals'
import { useReports } from '../../data/use-reports'
import { useSettings } from '../settings/useSettings'

const presets: Array<{ id: ReportPreset; label: string }> = [
  { id: 'this_week', label: 'This week' },
  { id: 'last_week', label: 'Last week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_30', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom' },
]

const colors = ['#0f766e', '#b45309', '#1d4ed8', '#be123c', '#6d28d9', '#047857']

function shortDay(day: string): string {
  return day.slice(5)
}

function ChartCard({
  title,
  pending,
  error,
  onRetry,
  empty,
  children,
}: {
  title: string
  pending: boolean
  error: unknown
  onRetry: () => void
  empty: boolean
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3">
        <QueryState isPending={pending} isError={Boolean(error)} error={error} onRetry={onRetry} label={`Loading ${title}`}>
          {empty ? (
            <EmptyState title="Nothing here yet" body="Finish a focus session and it will show up in this chart." />
          ) : (
            children
          )}
        </QueryState>
      </div>
    </section>
  )
}

export function ReportsPage() {
  const reports = useReports()
  const goals = useGoals()
  const settings = useSettings()
  const [preset, setPreset] = useState<ReportPreset>('this_week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [goalId, setGoalId] = useState<string | null>(null)

  const timeZone = settings.settings?.timezone ?? 'UTC'
  const weekStartsOn = settings.settings?.week_starts_on ?? 1
  const today = todayInTimeZone(timeZone, new Date())
  const range = reportRange(preset, today, weekStartsOn, { from: customFrom || today, to: customTo || today })
  const rows: ReportRows | undefined = reports.data
  const goalName = new Map((goals.data ?? []).map((goal) => [goal.id, goal.title]))
  goalName.set('none', 'No goal')

  const daily = rows ? dailySeries(rows.daily, range, goalId) : []
  const weekly = rows ? weeklyByGoal(rows.timeByGoal, range, goalId) : { points: [], goalIds: [] }
  const estimates = rows ? estimateVsActual(rows.taskFocus, range, goalId) : []
  const rates = rows ? interruptionRates(rows.daily, range, goalId) : []
  const reasons = rows ? topReasons(rows.interruptions, range, goalId) : []
  const hours = rows ? hourTotals(rows.hours, range, goalId) : []
  const streak = rows ? currentStreak(rows.daily, today) : 0
  const best = bestDay(daily)
  const focusMin = Math.round(daily.reduce((sum, point) => sum + point.focusMin, 0))
  const sessions = daily.reduce((sum, point) => sum + point.sessions, 0)
  const selectedName = goalId ? (goalName.get(goalId) ?? 'Goal') : null
  const retry = () => {
    void reports.refetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted">
            {range.from} to {range.to}
            {timeZone ? ` · ${timeZone}` : ''}
          </p>
        </div>
        {selectedName ? (
          <button type="button" onClick={() => setGoalId(null)} className="rounded-lg border border-border px-3 py-2 text-sm">
            Clear {selectedName}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPreset(item.id)}
            className={
              preset === item.id
                ? 'rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground'
                : 'rounded-lg border border-border px-3 py-1.5 text-sm'
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === 'custom' ? (
        <div className="flex flex-wrap gap-3">
          <label className="text-sm">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="mt-1 block rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="text-sm">
            To
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="mt-1 block rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Focus minutes" value={String(focusMin)} />
        <Summary label="Focus sessions" value={String(sessions)} testId="focus-sessions" />
        <Summary label="Current streak" value={streak === 1 ? '1 day' : `${streak} days`} />
        <Summary label="Best day" value={best ? `${shortDay(best.day)} · ${Math.round(best.focusMin)} min` : '—'} />
      </div>

      <ChartCard
        title="Focus by day"
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={!reports.isPending && !reports.error && sessions === 0}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily.map((point) => ({ ...point, label: shortDay(point.day) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="focusMin" name="Minutes" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Focus by week and goal"
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={weekly.points.length === 0}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly.points}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tickFormatter={shortDay} />
              <YAxis />
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
                  fill={colors[index % colors.length]}
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
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={estimates.length === 0}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estimates}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="title" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="estimateMin" name="Estimate" fill="#94a3b8" />
              <Bar dataKey="actualMin" name="Actual" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Interruption rate"
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={rates.length === 0}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rates.map((point) => ({ ...point, label: shortDay(point.day), percent: Math.round(point.rate * 100) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="percent" name="Interrupted" stroke="#b45309" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Top interruption reasons"
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={reasons.length === 0}
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reasons} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="reason" width={120} />
              <Tooltip />
              <Bar dataKey="interruptions" name="Interruptions" fill="#be123c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Hour of day"
        pending={reports.isPending}
        error={reports.error}
        onRetry={retry}
        empty={hours.every((value) => value === 0)}
      >
        <Heatmap hours={hours} />
      </ChartCard>
    </div>
  )
}

function Summary({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums" data-testid={testId}>
        {value}
      </p>
    </section>
  )
}

function Heatmap({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 0)
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[36rem] grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
        {hours.map((minutes, hour) => {
          const strength = max > 0 ? minutes / max : 0
          return (
            <div key={hour} className="text-center">
              <div
                title={`${hour}:00 · ${Math.round(minutes)} min`}
                className="h-10 rounded-md border border-border"
                style={{ backgroundColor: `rgba(15, 118, 110, ${0.12 + strength * 0.88})` }}
              />
              <p className="mt-1 text-[10px] text-muted">{hour}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
