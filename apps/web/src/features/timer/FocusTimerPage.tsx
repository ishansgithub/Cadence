import {
  completedFocusCount,
  cycleProgress,
  formatCountdown,
  remainingSeconds,
  type SessionType,
} from '@cadence/core'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { GoalChip } from '../../components/GoalChip'
import { ChunkyButton, IconButton } from '../../components/ui/ChunkyButton'
import { Mascot } from '../../components/ui/Mascot'
import { RotatingRing } from '../../components/ui/RotatingRing'
import { useSyncStatus } from '../../data/use-sync'
import { useGoals } from '../../data/use-goals'
import { useSetTaskStatus, useTasks } from '../../data/use-tasks'
import { toneFor, type Tone } from '../../lib/palette'
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

const ringCopy: Record<SessionType, { text: string; separator: string }> = {
  focus: { text: 'Stay with it', separator: '✦' },
  short_break: { text: 'Breathe out', separator: '☁' },
  long_break: { text: 'Stretch and rest', separator: '☕' },
}

function useRingSize() {
  const [size, setSize] = useState(() => (window.innerWidth < 420 ? 300 : window.innerWidth < 1024 ? 360 : 410))
  useEffect(() => {
    const onResize = () => setSize(window.innerWidth < 420 ? 300 : window.innerWidth < 1024 ? 360 : 410)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export function FocusTimerPage() {
  const timer = useTimer()
  const settings = useSettings()
  const tasks = useTasks()
  const goals = useGoals()
  const setStatus = useSetTaskStatus()
  const { offline, pending } = useSyncStatus()
  const navigate = useNavigate()
  const ringSize = useRingSize()
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
  const plannedSeconds = settings.settings
    ? (selectedMode === 'focus'
        ? settings.settings.focus_min
        : selectedMode === 'long_break'
          ? settings.settings.long_break_min
          : settings.settings.short_break_min) * 60
    : 0
  const displaySeconds =
    seconds ?? (timer.loading || active ? stableSeconds.current : null) ?? plannedSeconds

  const every = settings.settings?.sessions_before_long_break ?? 4
  const cycle = cycleProgress(completedFocusCount(timer.todaySessions), every, active?.type ?? null)
  const statusLabel = timer.paused
    ? 'Paused'
    : timer.completedMoment
      ? `${modeLabels[timer.completedMoment]} complete`
      : active
        ? modeLabels[active.type]
        : 'Ready'

  const currentMode = active?.type ?? selectedMode
  const tone: Tone =
    currentMode === 'short_break' ? 'sky' : currentMode === 'long_break' ? 'lilac' : goal ? toneFor(goal.id) : 'peach'
  const totalSeconds = active ? active.planned_min * 60 : plannedSeconds
  const fraction = totalSeconds > 0 ? Math.max(0, Math.min(1, displaySeconds / totalSeconds)) : 1

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

  const discRadius = ringSize * 0.33
  const arcRadius = discRadius - 10
  const circumference = 2 * Math.PI * arcRadius

  return (
    <main className={`tone-${tone} dot-grid relative flex min-h-svh flex-col overflow-hidden bg-background px-4 py-5`}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-tone opacity-70 blur-3xl"
        animate={{ scale: active && !timer.paused ? [1, 1.06, 1] : 1 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="relative mx-auto flex w-full max-w-xl flex-1 flex-col"
      >
        <div className="flex items-center justify-between gap-3">
          <IconButton icon="arrow-left" label="Close" onClick={() => navigate(-1)} />
          <AnimatePresence mode="popLayout">
            <motion.p
              key={statusLabel}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 rounded-full border-2 border-line bg-surface px-3.5 py-1 text-sm font-semibold"
            >
              <span
                aria-hidden
                className={`size-2 rounded-full bg-tone-strong ${active && !timer.paused ? 'animate-pulse' : ''}`}
              />
              {statusLabel}
            </motion.p>
          </AnimatePresence>
          <span className="w-11" />
        </div>

        <LayoutGroup id="focus-mode">
          <div
            role="tablist"
            aria-label="Session mode"
            className="chunky mt-6 grid grid-cols-3 gap-1 !rounded-full p-1.5"
          >
            {modes.map((mode) => {
              const selected = currentMode === mode.type
              return (
                <button
                  key={mode.type}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => void switchMode(mode.type)}
                  className={`relative min-h-11 rounded-full px-2 text-sm font-semibold ${
                    selected ? 'text-ink-foreground' : 'text-muted hover:text-foreground'
                  }`}
                >
                  {selected ? (
                    <motion.span
                      layoutId="focus-mode-pill"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>

        <div className="mt-8 flex justify-center">
          <RotatingRing
            text={ringCopy[currentMode].text}
            separator={ringCopy[currentMode].separator}
            repeats={3}
            size={ringSize}
            spinning={Boolean(active) && !timer.paused}
            speed={10}
          >
            <div
              className="chunky chunky-tone relative grid place-items-center !rounded-full"
              style={{ width: discRadius * 2, height: discRadius * 2, boxShadow: '5px 8px 0 0 var(--tone-slab)' }}
            >
              <svg
                aria-hidden
                className="absolute inset-0 -rotate-90"
                width={discRadius * 2 - 4}
                height={discRadius * 2 - 4}
                viewBox={`0 0 ${discRadius * 2 - 4} ${discRadius * 2 - 4}`}
              >
                <circle
                  cx={discRadius - 2}
                  cy={discRadius - 2}
                  r={arcRadius}
                  fill="none"
                  stroke="var(--tone-slab)"
                  strokeWidth={6}
                  opacity={0.5}
                />
                <motion.circle
                  cx={discRadius - 2}
                  cy={discRadius - 2}
                  r={arcRadius}
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: circumference * (1 - fraction) }}
                  transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                />
              </svg>
              <div className="relative text-center">
                <p
                  className="font-display text-6xl font-extrabold tracking-tight tabular-nums sm:text-7xl"
                  aria-live="polite"
                >
                  {formatCountdown(displaySeconds)}
                </p>
                <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
                  {modeLabels[currentMode]}
                </p>
              </div>
            </div>
          </RotatingRing>
        </div>

        <div className="mt-6 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={task?.id ?? 'none'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="font-display text-2xl font-bold"
            >
              {task?.title ?? 'No task'}
            </motion.p>
          </AnimatePresence>
          {goal ? (
            <div className="mt-2 flex justify-center">
              <GoalChip title={goal.title} id={goal.id} />
            </div>
          ) : null}
        </div>

        {cycle.total > 0 ? (
          <div
            className="mt-6 flex items-center justify-center gap-2.5"
            aria-label={`${cycle.filled} of ${cycle.total} focus sessions toward a long break`}
          >
            {Array.from({ length: cycle.total }, (_, index) => (
              <motion.span
                key={index}
                initial={false}
                animate={{ scale: index < cycle.filled ? [1, 1.35, 1] : 1 }}
                transition={{ duration: 0.4 }}
                className={`size-3.5 rounded-full border-2 border-line ${index < cycle.filled ? 'bg-ink' : 'bg-surface'}`}
              />
            ))}
          </div>
        ) : null}

        {!active ? (
          <label className="mx-auto mt-8 block w-full max-w-sm text-sm font-medium" htmlFor="focus-task">
            Task
            <select
              id="focus-task"
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              className="mt-1.5 w-full font-normal"
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
              <ChunkyButton
                size="lg"
                icon={timer.paused ? 'play' : 'pause'}
                onClick={() => (timer.paused ? timer.resumeTimer() : timer.pauseTimer())}
                className="min-w-36"
              >
                {timer.paused ? 'Resume' : 'Pause'}
              </ChunkyButton>
              <ChunkyButton
                size="lg"
                variant="primary"
                icon={active.type === 'focus' ? 'stop' : 'skip'}
                onClick={onStop}
                className="min-w-36"
              >
                {active.type === 'focus' ? 'Stop' : 'Skip'}
              </ChunkyButton>
            </>
          ) : (
            <ChunkyButton
              size="lg"
              variant="primary"
              icon="play"
              onClick={() => void onStart()}
              disabled={!settings.settings || timer.loading}
              className="min-w-48"
            >
              Start
            </ChunkyButton>
          )}
        </div>

        <AnimatePresence>
          {timer.promptTaskId ? (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="chunky mt-6 p-4"
            >
              <p className="text-sm font-medium">Mark this task done, or keep it in progress?</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <ChunkyButton
                  size="sm"
                  variant="primary"
                  icon="check"
                  onClick={() => {
                    setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'done' })
                    timer.dismissPrompt()
                  }}
                >
                  Mark done
                </ChunkyButton>
                <ChunkyButton
                  size="sm"
                  onClick={() => {
                    setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'in_progress' })
                    timer.dismissPrompt()
                  }}
                >
                  Keep in progress
                </ChunkyButton>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {timer.completedMoment ? (
          <p className="cadence-enter mt-4 text-center text-sm text-muted" role="status">
            {modeLabels[timer.completedMoment]} finished.
            <button
              type="button"
              className="ml-2 font-semibold text-foreground underline underline-offset-4"
              onClick={() => timer.dismissCompleted()}
            >
              Dismiss
            </button>
          </p>
        ) : null}

        {offline || pending ? (
          <p className="mt-4 text-center text-xs font-medium text-warning">
            {pending ? 'Changes pending — will sync when you’re back online.' : 'Offline — will sync when you’re back online.'}
          </p>
        ) : null}

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/today" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Back to Today
          </Link>
        </p>
      </motion.div>

      <Mascot
        name={currentMode === 'focus' ? 'cat' : 'frog'}
        className="cadence-float pointer-events-none absolute bottom-8 left-8 hidden size-28 [--float-rotate:-6deg] xl:block"
      />

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
