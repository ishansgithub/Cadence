import { isOverdue, type Goal, type Task } from '@cadence/core'
import { GoalChip } from '../../components/GoalChip'
import { useSetTaskStatus } from '../../data/use-tasks'
import { useTimer } from '../timer/useTimer'

export function TaskRow({
  task,
  goals,
  today,
  onOpen,
  showPlay = true,
}: {
  task: Task
  goals: Goal[]
  today: string
  onOpen: () => void
  showPlay?: boolean
}) {
  const setStatus = useSetTaskStatus()
  const timer = useTimer()
  const goal = goals.find((item) => item.id === task.goal_id)
  const overdue = isOverdue(task, today)
  const done = task.status === 'done'
  const running = timer.active?.type === 'focus' && timer.active.task_id === task.id

  return (
    <li
      className={`flex items-center gap-3 border-b border-border py-3 ${running ? 'bg-accent-muted/40' : ''}`}
    >
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-[var(--accent)]"
        checked={done}
        aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        onChange={() => setStatus.mutate({ id: task.id, status: done ? 'todo' : 'done' })}
      />
      <button type="button" onClick={onOpen} className="min-h-11 min-w-0 flex-1 text-left">
        <span className={done ? 'text-muted line-through' : ''}>{task.title}</span>
        {overdue && task.due_date ? (
          <span className="mt-0.5 block text-xs text-overdue">
            Overdue · <span className="tabular-nums">{task.due_date}</span>
          </span>
        ) : null}
      </button>
      {goal ? <GoalChip title={goal.title} /> : null}
      {task.estimate_min ? (
        <span className="shrink-0 text-sm tabular-nums text-muted">{task.estimate_min}m</span>
      ) : null}
      {showPlay && !done ? (
        <button
          type="button"
          aria-label={`Start focus on ${task.title}`}
          disabled={timer.loading || Boolean(timer.active)}
          onClick={() => void timer.startFocus(task.id)}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-accent disabled:opacity-50"
        >
          Play
        </button>
      ) : null}
    </li>
  )
}
