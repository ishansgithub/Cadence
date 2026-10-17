import { addCalendarDays, partitionToday, todayInTimeZone, type Task } from '@cadence/core'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState'
import { QueryState } from '../../components/QueryState'
import { useGoals } from '../../data/use-goals'
import { usePlanTask, useTasks, useUpdateTask } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { QuickAdd } from '../tasks/QuickAdd'
import { TaskDrawer } from '../tasks/TaskDrawer'
import { TaskRow } from '../tasks/TaskRow'
import { TimerPanel } from '../timer/TimerPanel'

export function TodayPage() {
  const tasks = useTasks()
  const goals = useGoals()
  const settings = useSettings()
  const planTask = usePlanTask()
  const updateTask = useUpdateTask()
  const [openTask, setOpenTask] = useState<Task | null>(null)
  const [doneOpen, setDoneOpen] = useState(false)

  const timeZone = settings.settings?.timezone
  const today = timeZone ? todayInTimeZone(timeZone, new Date()) : null
  const groups =
    today && timeZone ? partitionToday(tasks.data ?? [], today, timeZone) : null

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      <div className="mt-4">
        <TimerPanel />
      </div>
      {groups ? <p className="mt-1 text-sm text-muted">{groups.plannedEstimateMin} min estimated</p> : null}
      <div className="mt-4">
        {today ? (
          <QuickAdd goals={goals.data ?? []} today={today} plannedFor={today} />
        ) : (
          <p className="text-sm text-muted">Loading your time zone…</p>
        )}
      </div>

      <div className="mt-6 space-y-8">
        <QueryState
          isPending={tasks.isPending || goals.isPending || settings.loading}
          isError={tasks.isError || goals.isError || settings.error !== null || !settings.settings}
          error={tasks.error ?? goals.error ?? settings.error}
          onRetry={() => {
            void tasks.refetch()
            void goals.refetch()
          }}
          label="Loading today"
        >
          {groups && today ? (
            <>
              <section>
                <h2 className="text-lg font-semibold">Planned for today</h2>
                {groups.planned.length === 0 ? (
                  <div className="mt-3">
                    <EmptyState
                      title="Nothing planned"
                      body="Add a task above, or plan one from Tasks."
                      action={
                        <Link to="/tasks" className="rounded-lg border border-border px-3 py-2 text-sm">
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

              <section>
                <h2 className="text-lg font-semibold">Overdue</h2>
                {groups.overdue.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Nothing overdue.</p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {groups.overdue.map((task) => (
                      <li key={task.id} className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setOpenTask(task)} className="min-w-0 flex-1 text-left">
                          {task.title}
                          <span className="ml-2 text-sm text-danger">{task.due_date}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => planTask.mutate({ id: task.id, date: today })}
                          className="rounded-lg border border-border px-2 py-1 text-xs"
                        >
                          Plan for today
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateTask.mutate({
                              id: task.id,
                              input: { due_date: addCalendarDays(today, 1) },
                            })
                          }
                          className="rounded-lg border border-border px-2 py-1 text-xs"
                        >
                          Move due to tomorrow
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="text-lg font-semibold">Suggested</h2>
                {groups.suggested.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Nothing due today or tomorrow that is still unplanned.</p>
                ) : (
                  <ul className="mt-2 space-y-3">
                    {groups.suggested.map((task) => (
                      <li key={task.id} className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1">
                          {task.title}
                          <span className="ml-2 text-sm text-muted">{task.due_date}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => planTask.mutate({ id: task.id, date: today })}
                          className="rounded-lg border border-border px-2 py-1 text-xs"
                        >
                          Add to today
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <button
                  type="button"
                  aria-expanded={doneOpen}
                  onClick={() => setDoneOpen((current) => !current)}
                  className="text-lg font-semibold"
                >
                  Done today ({groups.doneToday.length})
                </button>
                {doneOpen ? (
                  groups.doneToday.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">Nothing completed today.</p>
                  ) : (
                    <ul className="mt-2">
                      {groups.doneToday.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          goals={goals.data ?? []}
                          today={today}
                          onOpen={() => setOpenTask(task)}
                        />
                      ))}
                    </ul>
                  )
                ) : null}
              </section>
            </>
          ) : null}
        </QueryState>
      </div>
      <TaskDrawer task={openTask} goals={goals.data ?? []} onClose={() => setOpenTask(null)} />
    </section>
  )
}
