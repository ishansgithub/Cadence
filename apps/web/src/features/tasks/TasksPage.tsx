import { filterTasks, todayInTimeZone, type Task, type TaskStatus } from '@cadence/core'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { QueryState } from '../../components/QueryState'
import { useGoals } from '../../data/use-goals'
import { useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { QuickAdd } from './QuickAdd'
import { TaskDrawer } from './TaskDrawer'
import { TaskRow } from './TaskRow'

const statuses: Array<TaskStatus | 'all'> = ['all', 'todo', 'in_progress', 'done', 'archived']

export function TasksPage() {
  const tasks = useTasks()
  const goals = useGoals()
  const settings = useSettings()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [goalId, setGoalId] = useState('all')
  const [planned, setPlanned] = useState<'all' | 'planned' | 'unplanned'>('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const today = settings.settings ? todayInTimeZone(settings.settings.timezone, new Date()) : null
  const visible = useMemo(() => {
    if (!today) return []
    let next = filterTasks(tasks.data ?? [], {
      status: status === 'all' ? undefined : status,
      goalId: goalId === 'all' ? undefined : goalId === 'none' ? null : goalId,
      search,
      overdue: overdueOnly,
      today,
    })
    if (planned === 'planned') next = next.filter((task) => task.planned_for !== null)
    if (planned === 'unplanned') next = next.filter((task) => task.planned_for === null)
    return next
  }, [goalId, overdueOnly, planned, search, status, tasks.data, today])

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
      <div className="mt-4">
        {today ? (
          <QuickAdd goals={goals.data ?? []} today={today} plannedFor={null} />
        ) : (
          <p className="text-sm text-muted">Loading your time zone…</p>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm" htmlFor="task-status-filter">
          Status
          <select
            id="task-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus | 'all')}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm" htmlFor="task-goal-filter">
          Goal
          <select
            id="task-goal-filter"
            value={goalId}
            onChange={(event) => setGoalId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="all">All goals</option>
            <option value="none">No goal</option>
            {(goals.data ?? []).map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm" htmlFor="task-planned-filter">
          Planned
          <select
            id="task-planned-filter"
            value={planned}
            onChange={(event) => setPlanned(event.target.value as 'all' | 'planned' | 'unplanned')}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="all">All</option>
            <option value="planned">Planned</option>
            <option value="unplanned">Unplanned</option>
          </select>
        </label>
        <label className="text-sm" htmlFor="task-search">
          Search
          <input
            id="task-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={overdueOnly} onChange={(event) => setOverdueOnly(event.target.checked)} />
        Overdue only
      </label>

      <div className="mt-6">
        <QueryState
          isPending={tasks.isPending || goals.isPending || settings.loading}
          isError={tasks.isError || goals.isError || settings.error !== null || !settings.settings}
          error={tasks.error ?? goals.error ?? settings.error}
          onRetry={() => {
            void tasks.refetch()
            void goals.refetch()
          }}
          label="Loading tasks"
        >
          {visible.length === 0 ? (
            <EmptyState title="No tasks" body="Add one above, or loosen the filters." />
          ) : (
            <ul>
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  goals={goals.data ?? []}
                  today={today ?? ''}
                  onOpen={() => setOpenTask(task)}
                />
              ))}
            </ul>
          )}
        </QueryState>
      </div>
      <TaskDrawer task={openTask} goals={goals.data ?? []} onClose={() => setOpenTask(null)} />
    </section>
  )
}
