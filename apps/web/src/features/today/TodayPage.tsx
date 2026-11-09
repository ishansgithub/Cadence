import {
  addCalendarDays,
  focusMinutesToday,
  partitionToday,
  todayInTimeZone,
  type Task,
} from '@cadence/core'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { useGoals } from '../../data/use-goals'
import { useTasks, useUpdateTask } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { QuickAdd } from '../tasks/QuickAdd'
import { TaskDrawer } from '../tasks/TaskDrawer'
import { TaskRow } from '../tasks/TaskRow'
import { useTimer } from '../timer/useTimer'
import { DaySummary } from './DaySummary'
import { TodaySkeleton } from './TodaySkeleton'

export function TodayPage() {
  const tasks = useTasks()
  const goals = useGoals()
  const settings = useSettings()
  const timer = useTimer()
  const updateTask = useUpdateTask()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [doneOpen, setDoneOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  const timeZone = settings.settings?.timezone
  const today = timeZone ? todayInTimeZone(timeZone, timer.now) : null
  const groups =
    today && timeZone ? partitionToday(tasks.data ?? [], today, timeZone) : null

  const loading = tasks.isPending || goals.isPending || settings.loading || !settings.settings
  const errored = tasks.isError || goals.isError || settings.error !== null

  async function rescheduleAll() {
    if (!groups || !today) return
    setRescheduling(true)
    const tomorrow = addCalendarDays(today, 1)
    try {
      await Promise.all(
        groups.overdue.map((task) =>
          updateTask.mutateAsync({ id: task.id, input: { due_date: tomorrow } }),
        ),
      )
    } finally {
      setRescheduling(false)
    }
  }

  const plannedTotal = groups
    ? groups.planned.length + groups.doneToday.filter((task) => task.planned_for === today).length
    : 0
  const doneCount = groups?.doneToday.length ?? 0
  const emptyDay = groups && groups.planned.length === 0 && groups.overdue.length === 0 && groups.doneToday.length === 0
  const allDone = groups && groups.planned.length === 0 && groups.overdue.length === 0 && groups.doneToday.length > 0

  return (
    <section className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        {today ? (
          <QuickAdd goals={goals.data ?? []} today={today} plannedFor={today} />
        ) : (
          <p className="text-sm text-muted">Loading your time zone…</p>
        )}
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Today</h1>

      {loading && !errored ? (
        <div className="mt-4">
          <TodaySkeleton />
        </div>
      ) : null}

      {errored ? (
        <div className="mt-4 rounded-xl border border-danger bg-danger-surface px-4 py-3 text-sm text-danger" role="alert">
          <p>{settings.error ?? (tasks.error instanceof Error ? tasks.error.message : 'Could not load today.')}</p>
          <button
            type="button"
            className="mt-2 min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
            onClick={() => {
              void tasks.refetch()
              void goals.refetch()
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !errored && groups && today ? (
        <div className="mt-4 space-y-8">
          <DaySummary
            focusMinutes={focusMinutesToday(timer.todaySessions, timer.now)}
            doneCount={doneCount}
            plannedCount={plannedTotal}
          />

          {emptyDay ? (
            <EmptyState
              title="Nothing planned"
              body="Add a task above, or plan one from Tasks."
              action={
                <Link
                  to="/tasks"
                  className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
                >
                  Go to Tasks
                </Link>
              }
            />
          ) : null}

          {allDone ? (
            <p className="text-sm text-muted">All caught up for today.</p>
          ) : null}

          {!emptyDay && (groups.planned.length > 0 || !allDone) ? (
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">Planned</h2>
                {groups.plannedEstimateMin > 0 ? (
                  <p className="text-sm tabular-nums text-muted">{groups.plannedEstimateMin}m estimated</p>
                ) : null}
              </div>
              {groups.planned.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="Nothing planned"
                    body="Add a task above, or plan one from Tasks."
                    action={
                      <Link
                        to="/tasks"
                        className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium"
                      >
                        Go to Tasks
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="mt-2">
                  {groups.planned.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      goals={goals.data ?? []}
                      today={today}
                      onOpen={() => setOpenTask(task)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {groups.overdue.length > 0 ? (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-overdue">
                  Overdue
                  <span className="ml-2 tabular-nums text-muted">({groups.overdue.length})</span>
                </h2>
                <button
                  type="button"
                  disabled={rescheduling}
                  onClick={() => void rescheduleAll()}
                  className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium disabled:opacity-50"
                >
                  Reschedule all
                </button>
              </div>
              <ul className="mt-2">
                {groups.overdue.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    goals={goals.data ?? []}
                    today={today}
                    onOpen={() => setOpenTask(task)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <button
              type="button"
              aria-expanded={doneOpen}
              onClick={() => setDoneOpen((current) => !current)}
              className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm font-semibold tracking-wide"
            >
              <span>
                Done
                <span className="ml-2 tabular-nums text-muted">({groups.doneToday.length})</span>
              </span>
              <span className="text-muted" aria-hidden>
                {doneOpen ? 'Hide' : 'Show'}
              </span>
            </button>
            {doneOpen ? (
              groups.doneToday.length === 0 ? (
                <p className="cadence-enter mt-2 text-sm text-muted">Nothing completed today.</p>
              ) : (
                <ul className="cadence-enter mt-2">
                  {groups.doneToday.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      goals={goals.data ?? []}
                      today={today}
                      showPlay={false}
                      onOpen={() => setOpenTask(task)}
                    />
                  ))}
                </ul>
              )
            ) : null}
          </section>
        </div>
      ) : null}

      <TaskDrawer task={openTask} goals={goals.data ?? []} onClose={() => setOpenTask(null)} />
    </section>
  )
}
