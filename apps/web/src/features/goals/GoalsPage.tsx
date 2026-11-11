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
  type DailyFocusRow,
  type Goal,
  type GoalCreate,
  type GoalStatus,
  type Task,
  type TimeByGoalRow,
} from '@cadence/core'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { GoalProgress } from '../../components/GoalProgress'
import { Modal } from '../../components/Modal'
import { QueryState } from '../../components/QueryState'
import { StatusBadge } from '../../components/StatusBadge'
import { ChunkyButton, IconButton } from '../../components/ui/ChunkyButton'
import { EmojiBadge } from '../../components/ui/ChunkyCard'
import { Heatmap } from '../../components/ui/Heatmap'
import { RingButton } from '../../components/ui/RotatingRing'
import { staggerChild, staggerParent } from '../../components/ui/variants'
import { useArchiveGoal, useCreateGoal, useGoals, useUpdateGoal } from '../../data/use-goals'
import { useReports } from '../../data/use-reports'
import { useTasks } from '../../data/use-tasks'
import { emojiFor, toneFor } from '../../lib/palette'
import { useSettings } from '../settings/useSettings'
import { TaskDrawer } from '../tasks/TaskDrawer'
import { TasksListRow } from '../tasks/TasksListRow'
import { useTimer } from '../timer/useTimer'
import { FocusTrend } from './FocusTrend'
import { formatMinutes, goalHeatCells } from './GoalActivity'
import { GoalForm } from './GoalForm'

const filterOptions: Array<{ value: GoalStatus | 'all'; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
]

function useGoalSession(goal: Goal, tasks: Task[]) {
  const timer = useTimer()
  const openTasks = tasks.filter(
    (task) => task.goal_id === goal.id && task.status !== 'done' && task.status !== 'archived',
  )
  const activeTask = timer.active?.task_id ? tasks.find((task) => task.id === timer.active?.task_id) : null
  const running = timer.active?.type === 'focus' && activeTask?.goal_id === goal.id
  const next = openTasks.find((task) => task.status === 'in_progress') ?? openTasks[0] ?? null

  function onRing() {
    if (running) {
      if (timer.paused) timer.resumeTimer()
      else timer.pauseTimer()
      return
    }
    void timer.startFocus(next?.id ?? null)
  }

  return {
    running,
    paused: running && timer.paused,
    blocked: !running && (Boolean(timer.active) || timer.loading),
    next,
    onRing,
  }
}

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

  function startCreate() {
    setEditing(null)
    setCreating(true)
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
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl">Goals</h1>
          <p className="mt-1 text-muted">Your activities, and where the hours went this week.</p>
        </div>
        <ChunkyButton variant="primary" icon="plus" onClick={startCreate}>
          New goal
        </ChunkyButton>
      </div>

      <LayoutGroup id="goal-filter">
        <div role="tablist" aria-label="Status" className="mt-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => setFilter(option.value)}
              className="pill-toggle relative !bg-transparent aria-selected:!text-ink-foreground"
            >
              {filter === option.value ? (
                <motion.span
                  layoutId="goal-filter-pill"
                  className="absolute inset-0 -z-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                />
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <div className="mt-8">
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
              mascot="fox"
              title="No goals here"
              body="Create a goal, or choose another status filter."
              action={
                <ChunkyButton variant="primary" icon="plus" onClick={startCreate}>
                  New goal
                </ChunkyButton>
              }
            />
          ) : (
            <motion.ul
              key={filter}
              variants={staggerParent}
              initial="hidden"
              animate="show"
              className="grid gap-x-10 gap-y-12 lg:grid-cols-2"
            >
              {visible.map((goal) => (
                <motion.li key={goal.id} variants={staggerChild}>
                  <GoalActivityCard
                    goal={goal}
                    tasks={tasks.data ?? []}
                    today={today}
                    weekStartsOn={weekStartsOn}
                    daily={reports.data?.daily ?? []}
                    timeByGoal={reports.data?.timeByGoal ?? []}
                    reportsPending={reports.isPending}
                    reportsError={reports.isError}
                    onOpen={() => setSelectedId(goal.id)}
                  />
                </motion.li>
              ))}
              <motion.li variants={staggerChild}>
                <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border-2 border-dashed border-border p-6">
                  <RingButton
                    ringText="New goal"
                    separator="✦"
                    shape="plus"
                    label="New goal"
                    tone="sage"
                    size={168}
                    onClick={startCreate}
                  />
                </div>
              </motion.li>
            </motion.ul>
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

function GoalActivityCard({
  goal,
  tasks,
  today,
  weekStartsOn,
  daily,
  timeByGoal,
  reportsPending,
  reportsError,
  onOpen,
}: {
  goal: Goal
  tasks: Task[]
  today: string
  weekStartsOn: number
  daily: DailyFocusRow[]
  timeByGoal: TimeByGoalRow[]
  reportsPending: boolean
  reportsError: boolean
  onOpen: () => void
}) {
  const tone = toneFor(goal.id)
  const emoji = emojiFor(goal.id)
  const session = useGoalSession(goal, tasks)
  const counts = countTasksForGoal(tasks, goal.id)
  const tasksProgress = taskCompletionProgress(counts)
  const week = weekStartOn(today, weekStartsOn)
  const weekMinutes = goalFocusMinutes(timeByGoal, goal.id, week)
  const focus = reportsError
    ? { progress: 0, label: 'Focus time unavailable' }
    : reportsPending
      ? { progress: 0, label: 'Loading focus time' }
      : goalProgress(goal, goalFocusMinutes(timeByGoal, goal.id, goal.target_type === 'hours_per_week' ? week : null), today)
  const cells = useMemo(
    () => goalHeatCells(daily, goal.id, today, weekStartsOn, 5),
    [daily, goal.id, today, weekStartsOn],
  )
  const ringText = session.running ? (session.paused ? 'Resume' : 'Pause session') : 'Start session'

  return (
    <article className={`tone-${tone}`}>
      <button
        type="button"
        onClick={onOpen}
        className="chunky chunky-hover flex w-full items-center gap-3 px-4 py-3.5 text-left active:!scale-100"
      >
        <EmojiBadge emoji={emoji} tone={tone} size={42} />
        <span className="min-w-0 flex-1">
          <span className="font-display block truncate text-lg font-bold">{goal.title}</span>
          <span className="mt-0.5 flex items-center gap-2">
            <StatusBadge status={goal.status} />
            {formatGoalTarget(goal) ? (
              <span className="truncate text-xs text-muted">{formatGoalTarget(goal)}</span>
            ) : null}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="font-display block text-xl font-bold tabular-nums text-tone-strong">
            {reportsPending ? '…' : formatMinutes(weekMinutes)}
          </span>
          <span className="block text-xs font-medium text-muted">This week</span>
        </span>
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-6 px-1 sm:justify-between">
        <RingButton
          ringText={ringText}
          separator={emoji}
          shape={session.running ? (session.paused ? 'play' : 'pause') : 'play'}
          label={
            session.running
              ? session.paused
                ? `Resume focus on ${goal.title}`
                : `Pause focus on ${goal.title}`
              : session.next
                ? `Start focus on ${session.next.title}`
                : `Start focus for ${goal.title}`
          }
          tone={tone}
          size={176}
          spinning={!session.paused}
          disabled={session.blocked}
          onClick={session.onRing}
        />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-end">
          <div className="flex items-start gap-2">
            <Heatmap
              cells={cells}
              tone={tone}
              cellSize={20}
              gap={5}
              ariaLabel={`Focus on ${goal.title} over the last 5 weeks`}
            />
            <span aria-hidden className="text-base">
              {emoji}
            </span>
          </div>
          <p className="text-xs text-muted">
            {session.running ? (
              <span className="font-semibold text-tone-strong">Focusing now</span>
            ) : session.next ? (
              <>
                Next: <span className="font-medium text-foreground">{session.next.title}</span>
              </>
            ) : (
              <>
                <span className="tabular-nums">{counts.open}</span> open ·{' '}
                <span className="tabular-nums">{counts.done}</span> done
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <GoalProgress progress={tasksProgress.progress} label={tasksProgress.label} />
        <GoalProgress progress={focus.progress} label={focus.label} />
      </div>
    </article>
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
  daily: DailyFocusRow[]
  timeByGoal: TimeByGoalRow[]
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
  onSaveGoal: (input: GoalCreate) => void
}) {
  const tone = toneFor(goal.id)
  const emoji = emojiFor(goal.id)
  const session = useGoalSession(goal, tasks)
  const linked = useMemo(() => tasksForGoal(tasks, goal.id), [goal.id, tasks])
  const counts = countTasksForGoal(tasks, goal.id)
  const tasksProgress = taskCompletionProgress(counts)
  const week = weekStartOn(today, weekStartsOn)
  const weekMinutes = goalFocusMinutes(timeByGoal, goal.id, week)
  const totalMinutes = goalFocusMinutes(timeByGoal, goal.id, null)
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
  const cells = useMemo(
    () => goalHeatCells(daily, goal.id, today, weekStartsOn, 12),
    [daily, goal.id, today, weekStartsOn],
  )
  const target = formatGoalTarget(goal)

  return (
    <section className={`tone-${tone}`}>
      <div className="flex items-center gap-3">
        <IconButton icon="arrow-left" label="Back to goals" onClick={onBack} />
        <span className="text-sm font-medium text-muted">Goals</span>
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.span
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
          >
            <EmojiBadge emoji={emoji} tone={tone} size={64} />
          </motion.span>
          <div>
            <h1 className="text-3xl md:text-4xl">{goal.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={goal.status} />
              {target ? <span className="text-sm text-muted">{target}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ChunkyButton onClick={onEdit}>Edit</ChunkyButton>
          <ChunkyButton onClick={onArchive}>{goal.status === 'archived' ? 'Unarchive' : 'Archive'}</ChunkyButton>
        </div>
      </div>
      {goal.description ? <p className="mt-4 max-w-2xl text-muted">{goal.description}</p> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="chunky chunky-tone flex flex-col items-center justify-center gap-2 p-6">
          <RingButton
            ringText={session.running ? (session.paused ? 'Resume' : 'Pause session') : 'Start session'}
            separator={emoji}
            shape={session.running && !session.paused ? 'pause' : 'play'}
            label={session.running ? (session.paused ? 'Resume focus' : 'Pause focus') : `Start focus for ${goal.title}`}
            tone={tone}
            size={210}
            spinning={!session.paused}
            disabled={session.blocked}
            onClick={session.onRing}
          />
          <p className="text-center text-sm text-muted">
            {session.next ? (
              <>
                Next up: <span className="font-semibold text-foreground">{session.next.title}</span>
              </>
            ) : (
              'No open tasks. Start an untitled session.'
            )}
          </p>
        </div>
        <div className="grid gap-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['This week', reportsPending ? '…' : formatMinutes(weekMinutes)],
              ['All time', reportsPending ? '…' : formatMinutes(totalMinutes)],
              ['Tasks done', `${counts.done}/${counts.open + counts.done}`],
            ].map(([label, value]) => (
              <div key={label} className="chunky px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <div className="chunky overflow-x-auto p-5">
            <p className="font-display text-lg font-bold">Last 12 weeks</p>
            <Heatmap
              className="mt-3"
              cells={cells}
              tone={tone}
              cellSize={18}
              gap={4}
              ariaLabel={`Focus on ${goal.title} over the last 12 weeks`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="chunky space-y-4 p-5">
          <p className="font-display text-lg font-bold">Progress</p>
          <GoalProgress progress={tasksProgress.progress} label={tasksProgress.label} />
          <GoalProgress progress={focus.progress} label={focus.label} />
        </div>
        <FocusTrend points={trend} />
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold">Linked tasks</h2>
        {linked.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              mascot="owl"
              title="No linked tasks"
              body="Link a task to this goal from Tasks, or use #goal in quick add."
            />
          </div>
        ) : (
          <motion.ul variants={staggerParent} initial="hidden" animate="show" className="mt-3 space-y-2.5">
            <AnimatePresence initial={false}>
              {linked.map((task) => (
                <TasksListRow
                  key={task.id}
                  task={task}
                  goals={goals}
                  today={today}
                  onOpen={() => onOpenTask(task)}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
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
