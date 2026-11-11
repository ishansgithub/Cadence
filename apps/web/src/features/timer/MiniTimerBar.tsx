import { formatCountdown, remainingSeconds } from '@cadence/core'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { ChunkyButton, IconButton } from '../../components/ui/ChunkyButton'
import { useGoals } from '../../data/use-goals'
import { useTasks } from '../../data/use-tasks'
import { emojiFor, toneFor } from '../../lib/palette'
import { InterruptSheet } from './InterruptSheet'
import { useTimer } from './useTimer'

const miniLabels = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
} as const

export function MiniTimerBar() {
  const timer = useTimer()
  const tasks = useTasks()
  const goals = useGoals()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [interruptOpen, setInterruptOpen] = useState(false)

  const active = timer.active
  const task = active?.task_id ? tasks.data?.find((item) => item.id === active.task_id) : null
  const goal = task?.goal_id ? goals.data?.find((item) => item.id === task.goal_id) : null
  const label = active ? (task?.title ?? miniLabels[active.type]) : ''
  const countdown = active ? formatCountdown(Math.max(0, remainingSeconds(active, timer.now, timer.pause))) : ''
  const tone = active?.type === 'focus' ? toneFor(goal?.id ?? task?.id) : 'sky'

  function onStopClick(event: MouseEvent) {
    event.stopPropagation()
    if (active?.type === 'focus') setInterruptOpen(true)
    else void timer.skipBreak()
  }

  function onPauseClick(event: MouseEvent) {
    event.stopPropagation()
    if (timer.paused) timer.resumeTimer()
    else timer.pauseTimer()
  }

  return (
    <>
      <AnimatePresence>
        {active ? (
          <motion.div
            key="mini-timer"
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{ borderRadius: expanded ? 28 : 999 }}
            className={`tone-${tone} chunky chunky-tone pointer-events-auto w-[min(100%,24rem)] overflow-hidden`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {expanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void navigate('/focus')}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-semibold">{label}</span>
                      {goal ? (
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {emojiFor(goal.id)} {goal.title}
                        </span>
                      ) : null}
                      <span className="font-display mt-1 block text-4xl font-bold tabular-nums">
                        {countdown}
                        {timer.paused ? <span className="ml-2 text-sm font-medium text-muted">Paused</span> : null}
                      </span>
                    </button>
                    <IconButton
                      icon="chevron-down"
                      label="Collapse timer"
                      aria-expanded={true}
                      onClick={() => setExpanded(false)}
                      size={36}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <ChunkyButton size="sm" icon={timer.paused ? 'play' : 'pause'} onClick={onPauseClick}>
                      {timer.paused ? 'Resume' : 'Pause'}
                    </ChunkyButton>
                    <ChunkyButton size="sm" icon={active.type === 'focus' ? 'stop' : 'skip'} onClick={onStopClick}>
                      {active.type === 'focus' ? 'Stop' : 'Skip'}
                    </ChunkyButton>
                    <ChunkyButton size="sm" variant="primary" icon="expand" onClick={() => void navigate('/focus')}>
                      Open
                    </ChunkyButton>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 py-1.5 pr-1.5 pl-2"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full px-2 text-left"
                    aria-expanded={false}
                    aria-label={`Expand timer, ${label}, ${countdown} remaining`}
                  >
                    <span className="relative flex size-2.5 shrink-0" aria-hidden>
                      {!timer.paused ? (
                        <span className="absolute inset-0 animate-ping rounded-full bg-tone-strong opacity-60" />
                      ) : null}
                      <span className="relative size-2.5 rounded-full bg-tone-strong" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</span>
                    <span className="font-display text-base font-bold tabular-nums">
                      {countdown}
                      {timer.paused ? <span className="ml-1 text-xs font-medium text-muted">Paused</span> : null}
                    </span>
                  </button>
                  <IconButton
                    icon={timer.paused ? 'play' : 'pause'}
                    label={timer.paused ? 'Resume' : 'Pause'}
                    onClick={onPauseClick}
                    size={36}
                  />
                  <IconButton
                    icon={active.type === 'focus' ? 'stop' : 'skip'}
                    label={active.type === 'focus' ? 'Stop' : 'Skip'}
                    variant="primary"
                    onClick={onStopClick}
                    size={36}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <InterruptSheet
        open={interruptOpen}
        onClose={() => setInterruptOpen(false)}
        onConfirm={(reason) => {
          setInterruptOpen(false)
          void timer.stopFocus(reason)
        }}
      />
    </>
  )
}

export function MiniTimerIndicator() {
  const timer = useTimer()
  if (!timer.active) return null
  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-3" aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-70" />
      <span className="relative size-3 rounded-full border-2 border-surface bg-accent" />
    </span>
  )
}