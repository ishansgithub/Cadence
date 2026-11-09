import { Link } from 'react-router'
import { useSetTaskStatus } from '../../data/use-tasks'
import { useTimer } from './useTimer'

/** Compact entry point used where a full-screen timer is not open. Prefer `/focus`. */
export function TimerPanel() {
  const timer = useTimer()
  const setStatus = useSetTaskStatus()

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Focus timer</h2>
          <p className="mt-1 text-sm text-muted">
            {timer.active ? 'A session is running.' : 'Open the full-screen timer to start.'}
          </p>
        </div>
        <Link
          to="/focus"
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground"
        >
          Open timer
        </Link>
      </div>
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
    </section>
  )
}
