import {
  addCalendarDays,
  countTasksForGoal,
  dailySeries,
  formatGoalTarget,
  goalFocusMinutes,
  goalProgress,
  taskCompletionProgress,
  tasksForGoal,
  todayInTimeZone,
  weekStartOn,
  type Goal,
  type GoalStatus,
  type Task,
} from '@cadence/core'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { GoalProgress } from '../../components/GoalProgress'
import { Modal } from '../../components/Modal'
import { QueryState } from '../../components/QueryState'
import { SelectMenu } from '../../components/SelectMenu'
import { StatusBadge } from '../../components/StatusBadge'
import { useArchiveGoal, useCreateGoal, useGoals, useUpdateGoal } from '../../data/use-goals'
import { useReports } from '../../data/use-reports'
import { useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { TaskDrawer } from '../tasks/TaskDrawer'
import { TasksListRow } from '../tasks/TasksListRow'
import { FocusTrend } from './FocusTrend'
import { GoalForm } from './GoalForm'

const filterOptions: Array<{ value: GoalStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'active' },
  { value: 'paused', label: 'paused' },
  { value: 'done', label: 'done' },
  { value: 'archived', label: 'archived' },
]

export function GoalsPage() {
  const goals = useGoals()
  const tasks = useTasks()
  const reports = useReports()
  const settings = useSettings()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const archiveGoal = useArchiveGoal()
  const [filter, setFilter] = useState<GoalStatus | 'all'>('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [creating, setCreating] = useState(false)
  const [openTask, setOpenTask] = useState<Task | null>(null)

  const visible = (goals.data ?? []).filter((goal) => filter === 'all' || goal.status === filter)
  const selected = (goals.data ?? []).find((goal) => goal.id === selectedId) ?? null
  const modalOpen = creating || editing !== null
  const pending = createGoal.isPending || updateGoal.isPending
  const today = settings.settings
    ? todayInTimeZone(settings.settings.timezone, new Date())
    : todayInTimeZone('UTC', new Date())
  const weekStartsOn = settings.settings?.week_starts_on ?? 1

  function closeModal() {
    setCreating(false)
    setEditing(null)
  }

  if (selected) {
    return (
      <GoalDetail
        goal={selected}
        tasks={tasks.data ?? []}
        goals={goals.data ?? []}
        today={today}
        weekStartsOn={weekStartsOn}
        reportsPending={reports.isPending}
        reportsError={reports.isError}
        daily={reports.data?.daily ?? []}
        timeByGoal={reports.data?.timeByGoal ?? []}
        onBack={() => setSelectedId(null)}
        onEdit={() => {
          setCreating(false)
          setEditing(selected)
        }}
        onArchive={() => {
          if (selected.status === 'archived') {
            updateGoal.mutate({ id: selected.id, input: { status: 'active' } })
          } else {
            archiveGoal.mutate(selected.id)
          }
        }}
        onOpenTask={setOpenTask}
        openTask={openTask}
        onCloseTask={() => setOpenTask(null)}
        editing={editing}
        creating={creating}
        modalOpen={modalOpen}
        pending={pending}
        closeModal={closeModal}
        onSaveGoal={(input) => {
          if (editing) {
            updateGoal.mutate({ id: editing.id, input }, { onSuccess: closeModal })
          } else {
            createGoal.mutate(input, { onSuccess: closeModal })
          }
        }}
      />
    )
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setCreating(true)
          }}
          className="min-h-11 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground"
        >
          New goal
        </button>
      </div>
      <div className="mt-4 max-w-xs">
        <SelectMenu
          id="goal-filter"
          label="Status"
          value={filter}
          options={filterOptions}
          onChange={(next) => setFilter(next as GoalStatus | 'all')}
        />
      </div>

      <div className="mt-6">
        <QueryState
          isPending={goals.isPending || tasks.isPending}
          isError={goals.isError || tasks.isError}
          error={goals.error ?? tasks.error}
          onRetry={() => {
            void goals.refetch()
            void tasks.refetch()
          }}
          label="Loading goals"
        >
          {visible.length === 0 ? (
            <EmptyState
              title="No goals here"
              body="Create a goal, or choose another status filter."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setCreating(true)
                  }}
                  className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
                >
                  New goal
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {visible.map((goal) => {
                const counts = countTasksForGoal(tasks.data ?? [], goal.id)
                const tasksProgress = taskCompletionProgress(counts)
                const target = formatGoalTarget(goal)
                const week = weekStartOn(today, weekStartsOn)
                const minutes = goalFocusMinutes(
                  reports.data?.timeByGoal ?? [],
                  goal.id,
                  goal.target_type === 'hours_per_week' ? week : null,
                )
                const focus = reports.isError
                  ? { progress: 0, label: 'Focus time unavailable' }
                  : reports.isPending
                    ? { progress: 0, label: 'Loading focus time' }
                    : goalProgress(goal, minutes, today)
                return (
                  <li key={goal.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(goal.id)}
                      className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">{goal.title}</h2>
                        <StatusBadge status={goal.status} />
                      </div>
                      {target ? <p className="mt-1 text-sm text-muted">{target}</p> : null}
                      <p className="mt-2 text-sm text-muted">
                        <span className="tabular-nums">{counts.open}</span> open ·{' '}
                        <span className="tabular-nums">{counts.done}</span> done
                      </p>
                      <div className="mt-3 space-y-3">
                        <GoalProgress progress={tasksProgress.progress} label={tasksProgress.label} />
                        <GoalProgress progress={focus.progress} label={focus.label} />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </QueryState>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit goal' : 'New goal'} onClose={closeModal}>
        <GoalForm
          key={editing?.id ?? 'new'}
          goal={editing ?? undefined}
          pending={pending}
          onSubmit={(input) => {
            if (editing) {
              updateGoal.mutate({ id: editing.id, input }, { onSuccess: closeModal })
            } else {
              createGoal.mutate(input, {
                onSuccess: (goal) => {
                  closeModal()
                  setSelectedId(goal.id)
                },
              })
            }
          }}
        />
      </Modal>
    </section>
  )
}

function GoalDetail({
  goal,
  tasks,
  goals,
  today,
  weekStartsOn,
  reportsPending,
  reportsError,
  daily,
  timeByGoal,
  onBack,
  onEdit,
  onArchive,
  onOpenTask,
  openTask,
  onCloseTask,
  editing,
  creating,
  modalOpen,
  pending,
  closeModal,
  onSaveGoal,
}: {
  goal: Goal
  tasks: Task[]
  goals: Goal[]
  today: string
  weekStartsOn: number
  reportsPending: boolean
  reportsError: boolean
  daily: import('@cadence/core').DailyFocusRow[]
  timeByGoal: import('@cadence/core').TimeByGoalRow[]
  onBack: () => void
  onEdit: () => void
  onArchive: () => void
  onOpenTask: (task: Task) => void
  openTask: Task | null
  onCloseTask: () => void
  editing: Goal | null
  creating: boolean
  modalOpen: boolean
  pending: boolean
  closeModal: () => void
  onSaveGoal: (input: import('@cadence/core').GoalCreate) => void
}) {
  const linked = useMemo(() => tasksForGoal(tasks, goal.id), [goal.id, tasks])
  const counts = countTasksForGoal(tasks, goal.id)
  const tasksProgress = taskCompletionProgress(counts)
  const week = weekStartOn(today, weekStartsOn)
  const minutes = goalFocusMinutes(
    timeByGoal,
    goal.id,
    goal.target_type === 'hours_per_week' ? week : null,
  )
  const focus = reportsError
    ? { progress: 0, label: 'Focus time unavailable' }
    : reportsPending
      ? { progress: 0, label: 'Loading focus time' }
      : goalProgress(goal, minutes, today)
  const trend = useMemo(() => {
    const range = { from: addCalendarDays(today, -13), to: today }
    return dailySeries(daily, range, goal.id)
  }, [daily, goal.id, today])
  const target = formatGoalTarget(goal)

  return (
    <section className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="min-h-11 text-sm font-medium text-accent"
      >
        Back to goals
      </button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{goal.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={goal.status} />
            {target ? <span className="text-sm text-muted">{target}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium"
          >
            {goal.status === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </div>
      {goal.description ? <p className="mt-4 text-sm text-muted">{goal.description}</p> : null}

      <div className="mt-6 space-y-3 rounded-xl border border-border bg-surface p-4">
        <GoalProgress progress={tasksProgress.progress} label={tasksProgress.label} />
        <GoalProgress progress={focus.progress} label={focus.label} />
      </div>

      <div className="mt-6">
        <FocusTrend points={trend} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide">Linked tasks</h2>
        {linked.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No linked tasks"
              body="Link a task to this goal from Tasks, or use #goal in quick add."
            />
          </div>
        ) : (
          <ul className="mt-2">
            {linked.map((task) => (
              <TasksListRow
                key={task.id}
                task={task}
                goals={goals}
                today={today}
                onOpen={() => onOpenTask(task)}
              />
            ))}
          </ul>
        )}
      </div>

      <TaskDrawer task={openTask} goals={goals} onClose={onCloseTask} />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit goal' : creating ? 'New goal' : 'Goal'}
        onClose={closeModal}
      >
        <GoalForm
          key={editing?.id ?? 'new-detail'}
          goal={editing ?? undefined}
          pending={pending}
          onSubmit={onSaveGoal}
        />
      </Modal>
    </section>
  )
}
