import { Link } from 'react-router'
import { useSetTaskStatus } from '../../data/use-tasks'
import { useTimer } from './useTimer'

/** Compact entry point used where a full-screen timer is not open. Prefer `/focus`. */
export function TimerPanel() {
  const timer = useTimer()
  const setStatus = useSetTaskStatus()

  return (
    <section className="chunky p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Focus timer</h2>
          <p className="mt-1 text-sm text-muted">
            {timer.active ? 'A session is running.' : 'Open the full-screen timer to start.'}
          </p>
        </div>
        <Link
          to="/focus"
          className="chunky-btn bg-ink text-ink-foreground"
        >
          Open timer
        </Link>
      </div>
      {timer.promptTaskId ? (
        <div className="mt-4 rounded-[var(--radius-md)] bg-background p-3">
          <p className="text-sm">Mark this task done, or keep it in progress?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'done' })
                timer.dismissPrompt()
              }}
              className="chunky-btn bg-ink text-ink-foreground"
            >
              Mark done
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus.mutate({ id: timer.promptTaskId ?? '', status: 'in_progress' })
                timer.dismissPrompt()
              }}
              className="chunky-btn bg-surface"
            >
              Keep in progress
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
