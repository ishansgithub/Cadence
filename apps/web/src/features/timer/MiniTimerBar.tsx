import { formatCountdown, remainingSeconds } from '@cadence/core'
import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import { useGoals } from '../../data/use-goals'
import { useTasks } from '../../data/use-tasks'
import { InterruptSheet } from './InterruptSheet'
import { useTimer } from './useTimer'

const miniLabels = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
} as const

export function MiniTimerBar({ layout }: { layout: 'mobile' | 'sidebar' }) {
  const timer = useTimer()
  const tasks = useTasks()
  const goals = useGoals()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(layout === 'sidebar')
  const [interruptOpen, setInterruptOpen] = useState(false)

  const active = timer.active
  if (!active) return null

  const task = active.task_id ? tasks.data?.find((item) => item.id === active.task_id) : null
  const goal = task?.goal_id ? goals.data?.find((item) => item.id === task.goal_id) : null
  const label = task?.title ?? miniLabels[active.type]
  const countdown = formatCountdown(Math.max(0, remainingSeconds(active, timer.now, timer.pause)))

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

  const shell =
    layout === 'mobile'
      ? 'cadence-sheet fixed inset-x-0 bottom-16 z-30 border-t border-border bg-surface-raised'
      : 'cadence-enter rounded-xl border border-border bg-background p-3'

  return (
    <>
      <div className={shell}>
        {expanded ? (
          <div className={layout === 'mobile' ? 'space-y-2 px-3 py-3' : 'space-y-3'}>
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => void navigate('/focus')}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium">{label}</span>
                {goal ? <span className="mt-0.5 block truncate text-xs text-muted">{goal.title}</span> : null}
                <span className="mt-1 block text-lg font-semibold tabular-nums">
                  {countdown}
                  {timer.paused ? <span className="ml-2 text-sm font-normal text-muted">Paused</span> : null}
                </span>
              </button>
              {layout === 'mobile' ? (
                <button
                  type="button"
                  aria-expanded={true}
                  onClick={() => setExpanded(false)}
                  className="min-h-11 shrink-0 rounded-lg px-2 text-sm text-muted"
                >
                  Collapse
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onPauseClick}
                className="min-h-10 rounded-lg border border-border bg-surface px-2 text-xs font-medium"
              >
                {timer.paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={onStopClick}
                className="min-h-10 rounded-lg border border-border bg-surface px-2 text-xs font-medium"
              >
                {active.type === 'focus' ? 'Stop' : 'Skip'}
              </button>
              <button
                type="button"
                onClick={() => void navigate('/focus')}
                className="min-h-10 rounded-lg bg-accent px-2 text-xs font-medium text-accent-foreground"
              >
                Open
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="min-h-11 min-w-0 flex-1 rounded-lg px-1 text-left"
              aria-expanded={false}
              aria-label={`Expand timer, ${label}, ${countdown} remaining`}
            >
              <span className="block truncate text-sm font-medium">{label}</span>
              <span className="text-sm font-semibold tabular-nums text-muted">
                {countdown}
                {timer.paused ? ' · Paused' : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={onStopClick}
              className="min-h-11 shrink-0 rounded-lg border border-border bg-surface px-3 text-sm font-medium"
            >
              {active.type === 'focus' ? 'Stop' : 'Skip'}
            </button>
          </div>
        )}
      </div>
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
