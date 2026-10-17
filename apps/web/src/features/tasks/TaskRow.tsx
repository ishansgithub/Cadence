import { isOverdue, type Goal, type Task } from '@cadence/core'
import { GoalChip } from '../../components/GoalChip'
import { usePlanTask, useSetTaskStatus } from '../../data/use-tasks'

export function TaskRow({
  task,
  goals,
  today,
  onOpen,
}: {
  task: Task
  goals: Goal[]
  today: string
  onOpen: () => void
}) {
  const setStatus = useSetTaskStatus()
  const planTask = usePlanTask()
  const goal = goals.find((item) => item.id === task.goal_id)
  const overdue = isOverdue(task, today)
  const planned = task.planned_for === today
  const done = task.status === 'done'

  return (
    <li className="flex flex-wrap items-center gap-2 border-b border-border py-3">
      <input
        type="checkbox"
        checked={done}
        aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        onChange={() => setStatus.mutate({ id: task.id, status: done ? 'todo' : 'done' })}
      />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className={done ? 'text-muted line-through' : ''}>{task.title}</span>
      </button>
      {goal ? <GoalChip title={goal.title} /> : null}
      {task.estimate_min ? <span className="text-sm text-muted">{task.estimate_min}m</span> : null}
      {task.due_date ? (
        <span className={overdue ? 'text-sm text-danger' : 'text-sm text-muted'}>{task.due_date}</span>
      ) : null}
      <button
        type="button"
        onClick={() => planTask.mutate({ id: task.id, date: planned ? null : today })}
        className="rounded-lg border border-border px-2 py-1 text-xs"
      >
        {planned ? 'Unplan' : 'Plan for today'}
      </button>
    </li>
  )
}
