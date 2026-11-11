import {
  filterTasks,
  groupTasksForList,
  todayInTimeZone,
  type Task,
  type TaskDueFilter,
  type TaskStatus,
} from '@cadence/core'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { QueryState } from '../../components/QueryState'
import { SelectMenu } from '../../components/SelectMenu'
import { Icon } from '../../components/ui/Icon'
import { staggerParent } from '../../components/ui/variants'
import { useGoals } from '../../data/use-goals'
import { useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { QuickAdd } from './QuickAdd'
import { TaskDrawer } from './TaskDrawer'
import { TasksListRow } from './TasksListRow'

const statusOptions: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
]
const dueOptions: Array<{ value: TaskDueFilter; label: string }> = [
  { value: 'all', label: 'All dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'none', label: 'No date' },
]

const groupTone: Record<string, string> = {
  overdue: 'tone-rose',
  today: 'tone-peach',
  upcoming: 'tone-sky',
  none: 'tone-lilac',
  done: 'tone-sage',
}

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
    <section className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl md:text-5xl">Tasks</h1>
          <p className="mt-1 text-muted">Everything on your plate, grouped by when it&rsquo;s due.</p>
        </div>
        <p className="font-display text-lg font-bold tabular-nums text-muted">
          {visible.length} <span className="text-sm font-medium">shown</span>
        </p>
      </div>

      <div className="mt-6">
        {today ? (
          <QuickAdd goals={goals.data ?? []} today={today} plannedFor={null} />
        ) : (
          <div className="skeleton h-13 !rounded-full" />
        )}
      </div>

      <LayoutGroup id="task-status">
        <div role="tablist" aria-label="Status" className="mt-6 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={status === option.value}
              onClick={() => setStatus(option.value)}
              className="pill-toggle relative !bg-transparent aria-selected:!text-ink-foreground"
            >
              {status === option.value ? (
                <motion.span
                  layoutId="task-status-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                />
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
          <span className="relative mt-1 block">
            <input
              id="task-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="chunky-input !pr-9 text-sm font-normal"
              placeholder="Title or notes"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-2 grid size-7 !min-h-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"
              >
                <Icon name="close" size={14} strokeWidth={2.6} />
              </button>
            ) : null}
          </span>
        </label>
      </div>

      <div className="mt-8">
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
              mascot={hasAnyTasks ? 'owl' : 'cat'}
              title={hasAnyTasks ? 'No tasks match' : 'No tasks yet'}
              body={
                hasAnyTasks
                  ? 'Loosen the filters, or add something new above.'
                  : 'Add a task above to start building the list.'
              }
            />
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <section key={group.id} className={groupTone[group.id] ?? 'tone-peach'}>
                  <h2 className="flex items-center gap-2.5 text-xl font-bold">
                    <span aria-hidden className="size-3 rounded-full border-2 border-line bg-tone-slab" />
                    <span className={group.id === 'overdue' ? 'text-overdue' : ''}>{group.label}</span>
                    <span className="rounded-full bg-tone px-2 py-0.5 font-sans text-xs font-semibold tabular-nums text-muted">
                      {group.tasks.length}
                    </span>
                  </h2>
                  <motion.ul variants={staggerParent} initial="hidden" animate="show" className="mt-3 space-y-2">
                    <AnimatePresence initial={false}>
                      {group.tasks.map((task) => (
                        <TasksListRow
                          key={task.id}
                          task={task}
                          goals={goals.data ?? []}
                          today={today ?? ''}
                          onOpen={() => setOpenTask(task)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.ul>
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
