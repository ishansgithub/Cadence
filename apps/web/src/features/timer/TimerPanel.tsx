import { formatCountdown, remainingSeconds, todayInTimeZone } from '@cadence/core'
import { useState } from 'react'
import { useSetTaskStatus, useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { interruptReasons } from './timer-context'
import { useTimer } from './useTimer'

const sessionLabels = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
} as const

export function TimerPanel() {
  const timer = useTimer()
  const tasks = useTasks()
  const settings = useSettings()
  const setStatus = useSetTaskStatus()
  const [taskId, setTaskId] = useState('')
  const [choosingReason, setChoosingReason] = useState(false)
  const today = settings.settings ? todayInTimeZone(settings.settings.timezone, timer.now) : null
  const openTasks = [...(tasks.data ?? [])]
    .filter((task) => task.status !== 'done' && task.status !== 'archived')
    .sort((a, b) => Number(b.planned_for === today) - Number(a.planned_for === today))
  const focusCount = timer.todaySessions.filter((session) => session.type === 'focus').length
  const countdown = timer.active ? formatCountdown(remainingSeconds(timer.active, timer.now)) : null

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{timer.active ? sessionLabels[timer.active.type] : 'Focus'}</h2>
        <p className="text-sm text-muted">{focusCount} focus sessions today</p>
      </div>
      <p className="mt-4 text-center text-6xl font-semibold tabular-nums tracking-tight">{countdown ?? '0:00'}</p>
      {timer.active?.type === 'focus' && choosingReason ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {interruptReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => {
                void timer.stopFocus(reason).then(() => setChoosingReason(false))
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              {reason}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {timer.active ? (
            timer.active.type === 'focus' ? (
              <button
                type="button"
                onClick={() => setChoosingReason(true)}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void timer.skipBreak()}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                Skip break
              </button>
            )
          ) : (
            <>
              <label className="min-w-0 flex-1 text-sm" htmlFor="timer-task">
                Task
                <select
                  id="timer-task"
                  value={taskId}
                  onChange={(event) => setTaskId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option value="">No task</option>
                  {openTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void timer.startFocus(taskId || null)}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                Start
              </button>
            </>
          )}
        </div>
      )}
      {timer.promptTaskId ? (
        <div className="mt-4 rounded-xl bg-background p-3">
          <p className="text-sm">Mark this task done, or keep it in progress?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'done' })
                timer.dismissPrompt()
              }}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
            >
              Mark done
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'in_progress' })
                timer.dismissPrompt()
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Keep in progress
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
