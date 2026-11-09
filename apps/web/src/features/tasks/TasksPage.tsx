import {
  filterTasks,
  groupTasksForList,
  todayInTimeZone,
  type Task,
  type TaskDueFilter,
  type TaskStatus,
} from '@cadence/core'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { QueryState } from '../../components/QueryState'
import { SelectMenu } from '../../components/SelectMenu'
import { useGoals } from '../../data/use-goals'
import { useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { QuickAdd } from './QuickAdd'
import { TaskDrawer } from './TaskDrawer'
import { TasksListRow } from './TasksListRow'

const statusOptions: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'todo' },
  { value: 'in_progress', label: 'in progress' },
  { value: 'done', label: 'done' },
  { value: 'archived', label: 'archived' },
]
const dueOptions: Array<{ value: TaskDueFilter; label: string }> = [
  { value: 'all', label: 'All dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'none', label: 'No date' },
]

const fieldClass = 'mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm'

export function TasksPage() {
  const tasks = useTasks()
  const goals = useGoals()
  const settings = useSettings()
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')
  const [goalId, setGoalId] = useState('all')
  const [due, setDue] = useState<TaskDueFilter>('all')
  const [search, setSearch] = useState('')
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const today = settings.settings ? todayInTimeZone(settings.settings.timezone, new Date()) : null
  const visible = useMemo(() => {
    if (!today) return []
    return filterTasks(tasks.data ?? [], {
      status: status === 'all' ? undefined : status,
      goalId: goalId === 'all' ? undefined : goalId === 'none' ? null : goalId,
      due,
      search,
      today,
    })
  }, [due, goalId, search, status, tasks.data, today])

  const groups = useMemo(() => (today ? groupTasksForList(visible, today) : []), [today, visible])
  const hasAnyTasks = (tasks.data ?? []).length > 0

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
      <div className="sticky top-0 z-20 -mx-4 mt-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        {today ? (
          <QuickAdd goals={goals.data ?? []} today={today} plannedFor={null} />
        ) : (
          <p className="text-sm text-muted">Loading your time zone…</p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectMenu
          id="task-status-filter"
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(next) => setStatus(next as TaskStatus | 'all')}
        />
        <SelectMenu
          id="task-goal-filter"
          label="Goal"
          value={goalId}
          options={[
            { value: 'all', label: 'All goals' },
            { value: 'none', label: 'No goal' },
            ...(goals.data ?? []).map((goal) => ({ value: goal.id, label: goal.title })),
          ]}
          onChange={setGoalId}
        />
        <SelectMenu
          id="task-due-filter"
          label="Due"
          value={due}
          options={dueOptions}
          onChange={(next) => setDue(next as TaskDueFilter)}
        />
        <label className="text-sm font-medium" htmlFor="task-search">
          Search
          <input
            id="task-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={fieldClass}
            placeholder="Title or notes"
          />
        </label>
      </div>

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
            <EmptyState
              title={hasAnyTasks ? 'No tasks match' : 'No tasks yet'}
              body={
                hasAnyTasks
                  ? 'Loosen the filters, or add something new above.'
                  : 'Add a task above to start building the list.'
              }
            />
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.id}>
                  <h2
                    className={`text-sm font-semibold tracking-wide ${
                      group.id === 'overdue' ? 'text-overdue' : 'text-foreground'
                    }`}
                  >
                    {group.label}
                    <span className="ml-2 tabular-nums text-muted">({group.tasks.length})</span>
                  </h2>
                  <ul className="mt-2">
                    {group.tasks.map((task) => (
                      <TasksListRow
                        key={task.id}
                        task={task}
                        goals={goals.data ?? []}
                        today={today ?? ''}
                        onOpen={() => setOpenTask(task)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </QueryState>
      </div>
      <TaskDrawer task={openTask} goals={goals.data ?? []} onClose={() => setOpenTask(null)} />
    </section>
  )
}
