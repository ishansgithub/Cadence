import {
  completedFocusCount,
  cycleProgress,
  formatCountdown,
  remainingSeconds,
  type SessionType,
} from '@cadence/core'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { GoalChip } from '../../components/GoalChip'
import { useSyncStatus } from '../../data/use-sync'
import { useGoals } from '../../data/use-goals'
import { useSetTaskStatus, useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { InterruptSheet } from './InterruptSheet'
import { useTimer } from './useTimer'

const modes: Array<{ type: SessionType; label: string }> = [
  { type: 'focus', label: 'Focus' },
  { type: 'short_break', label: 'Short break' },
  { type: 'long_break', label: 'Long break' },
]

const modeLabels = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
} as const

export function FocusTimerPage() {
  const timer = useTimer()
  const settings = useSettings()
  const tasks = useTasks()
  const goals = useGoals()
  const setStatus = useSetTaskStatus()
  const { offline, pending } = useSyncStatus()
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<SessionType>('focus')
  const [taskId, setTaskId] = useState('')
  const [interruptOpen, setInterruptOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState<SessionType | null>(null)
  const stableSeconds = useRef<number | null>(null)

  const active = timer.active
  const task = active?.task_id
    ? tasks.data?.find((item) => item.id === active.task_id)
    : tasks.data?.find((item) => item.id === taskId)
  const goal = task?.goal_id ? goals.data?.find((item) => item.id === task.goal_id) : null

  useEffect(() => {
    if (active) setSelectedMode(active.type)
  }, [active?.type])

  const seconds =
    active && !timer.loading
      ? Math.max(0, remainingSeconds(active, timer.now, timer.pause))
      : null
  if (seconds !== null) stableSeconds.current = seconds
  const displaySeconds =
    seconds ??
    (timer.loading || active ? stableSeconds.current : null) ??
    (settings.settings
      ? (selectedMode === 'focus'
          ? settings.settings.focus_min
          : selectedMode === 'long_break'
            ? settings.settings.long_break_min
            : settings.settings.short_break_min) * 60
      : 0)

  const every = settings.settings?.sessions_before_long_break ?? 4
  const cycle = cycleProgress(completedFocusCount(timer.todaySessions), every, active?.type ?? null)
  const statusLabel = timer.paused
    ? 'Paused'
    : timer.completedMoment
      ? `${modeLabels[timer.completedMoment]} complete`
      : active
        ? modeLabels[active.type]
        : 'Ready'

  async function switchMode(type: SessionType) {
    if (!active) {
      setSelectedMode(type)
      return
    }
    if (type === active.type) return
    if (active.type === 'focus') {
      setPendingMode(type)
      setInterruptOpen(true)
      return
    }
    await timer.skipBreak()
    await timer.startMode(type, type === 'focus' ? taskId || null : null)
  }

  async function onStart() {
    await timer.startMode(selectedMode, selectedMode === 'focus' ? taskId || null : null)
  }

  function onStop() {
    if (!active) return
    if (active.type === 'focus') setInterruptOpen(true)
    else void timer.skipBreak()
  }

  async function onInterrupt(reason: string | null) {
    setInterruptOpen(false)
    await timer.stopFocus(reason)
    if (pendingMode) {
      const next = pendingMode
      setPendingMode(null)
      await timer.startMode(next, next === 'focus' ? taskId || null : null)
    }
  }

  const openTasks = [...(tasks.data ?? [])]
    .filter((item) => item.status !== 'done' && item.status !== 'archived')
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <main className="cadence-enter flex min-h-svh flex-col bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-11 rounded-lg px-2 text-sm font-medium text-accent"
          >
            Close
          </button>
          <p className="text-sm font-medium text-muted">{statusLabel}</p>
          <span className="w-14" />
        </div>

        <div
          role="tablist"
          aria-label="Session mode"
          className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1"
        >
          {modes.map((mode) => {
            const selected = (active?.type ?? selectedMode) === mode.type
            return (
              <button
                key={mode.type}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => void switchMode(mode.type)}
                className={`min-h-11 rounded-lg px-2 text-sm font-medium ${
                  selected ? 'bg-accent-muted text-accent' : 'text-muted hover:text-foreground'
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>

        <p
          className="mt-10 text-center text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl"
          aria-live="polite"
        >
          {formatCountdown(displaySeconds)}
        </p>

        <div className="mt-6 text-center">
          <p className="text-lg font-medium tracking-tight">{task?.title ?? 'No task'}</p>
          {goal ? (
            <div className="mt-2 flex justify-center">
              <GoalChip title={goal.title} />
            </div>
          ) : null}
        </div>

        {cycle.total > 0 ? (
          <div className="mt-8 flex items-center justify-center gap-2" aria-label={`${cycle.filled} of ${cycle.total} focus sessions toward a long break`}>
            {Array.from({ length: cycle.total }, (_, index) => (
              <span
                key={index}
                className={`size-2.5 rounded-full ${index < cycle.filled ? 'bg-accent' : 'bg-border'}`}
              />
            ))}
          </div>
        ) : null}

        {!active ? (
          <label className="mt-8 block text-sm font-medium" htmlFor="focus-task">
            Task
            <select
              id="focus-task"
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2"
            >
              <option value="">No task</option>
              {openTasks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="mt-auto flex flex-wrap justify-center gap-3 pt-10">
          {active ? (
            <>
              <button
                type="button"
                onClick={() => (timer.paused ? timer.resumeTimer() : timer.pauseTimer())}
                className="min-h-11 min-w-28 rounded-lg border border-border bg-surface px-4 text-sm font-medium"
              >
                {timer.paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={onStop}
                className="min-h-11 min-w-28 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground"
              >
                {active.type === 'focus' ? 'Stop' : 'Skip'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void onStart()}
              disabled={!settings.settings || timer.loading}
              className="min-h-11 min-w-40 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              Start
            </button>
          )}
        </div>

        {timer.promptTaskId ? (
          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <p className="text-sm">Mark this task done, or keep it in progress?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'done' })
                  timer.dismissPrompt()
                }}
                className="min-h-11 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground"
              >
                Mark done
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'in_progress' })
                  timer.dismissPrompt()
                }}
                className="min-h-11 rounded-lg border border-border px-3 text-sm"
              >
                Keep in progress
              </button>
            </div>
          </div>
        ) : null}

        {timer.completedMoment ? (
          <p className="mt-4 text-center text-sm text-muted" role="status">
            {modeLabels[timer.completedMoment]} finished.
            <button type="button" className="ml-2 text-accent" onClick={() => timer.dismissCompleted()}>
              Dismiss
            </button>
          </p>
        ) : null}

        {offline || pending ? (
          <p className="mt-4 text-center text-xs text-warning">
            {pending ? 'Changes pending — will sync when you’re back online.' : 'Offline — will sync when you’re back online.'}
          </p>
        ) : null}

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/today" className="text-accent">
            Back to Today
          </Link>
        </p>
      </div>

      <InterruptSheet
        open={interruptOpen}
        onClose={() => {
          setInterruptOpen(false)
          setPendingMode(null)
        }}
        onConfirm={(reason) => void onInterrupt(reason)}
      />
    </main>
  )
}
