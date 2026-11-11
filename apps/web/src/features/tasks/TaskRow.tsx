import { isOverdue, type Goal, type Task } from '@cadence/core'
import { motion } from 'motion/react'
import { GoalChip } from '../../components/GoalChip'
import { Icon } from '../../components/ui/Icon'
import { staggerChild } from '../../components/ui/variants'
import { useSetTaskStatus } from '../../data/use-tasks'
import { toneFor } from '../../lib/palette'
import { useTimer } from '../timer/useTimer'

export function PlayButton({
  title,
  disabled,
  onClick,
  className = '',
}: {
  title: string
  disabled: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={`Start focus on ${title}`}
      title="Start focus"
      disabled={disabled}
      onClick={onClick}
      className={`chunky-btn bg-tone !size-11 !min-h-11 shrink-0 !p-0 text-foreground ${className}`}
    >
      <Icon name="play" size={17} strokeWidth={2.4} />
    </button>
  )
}

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
  const tone = goal ? toneFor(goal.id) : overdue ? 'rose' : 'peach'

  return (
    <motion.li
      layout
      variants={staggerChild}
      exit="exit"
      className={`tone-${tone} chunky-soft chunky-hover group flex items-center gap-3 px-3 py-1.5 ${
        running ? 'chunky-tone !border-line' : ''
      } ${done ? 'opacity-70' : ''}`}
    >
      <input
        type="checkbox"
        checked={done}
        aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        onChange={() => setStatus.mutate({ id: task.id, status: done ? 'todo' : 'done' })}
      />
      <button type="button" onClick={onOpen} className="min-h-11 min-w-0 flex-1 py-1.5 text-left active:!scale-100">
        <span className={`font-medium ${done ? 'text-muted line-through decoration-2' : ''}`}>{task.title}</span>
        {running ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-tone-strong">
            <span className="size-1.5 animate-pulse rounded-full bg-tone-strong" /> Focusing now
          </span>
        ) : overdue && task.due_date ? (
          <span className="mt-0.5 block text-xs font-medium text-overdue">
            Overdue · <span className="tabular-nums">{task.due_date}</span>
          </span>
        ) : null}
      </button>
      {goal ? (
        <span className="hidden sm:inline-flex">
          <GoalChip title={goal.title} id={goal.id} />
        </span>
      ) : null}
      {task.estimate_min ? (
        <span className="shrink-0 rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-semibold tabular-nums text-muted">
          {task.estimate_min}m
        </span>
      ) : null}
      {showPlay && !done ? (
        <PlayButton
          title={task.title}
          disabled={timer.loading || Boolean(timer.active)}
          onClick={() => void timer.startFocus(task.id)}
        />
      ) : null}
    </motion.li>
  )
}
