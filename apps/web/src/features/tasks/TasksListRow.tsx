import { isOverdue, type Goal, type Task } from '@cadence/core'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { GoalChip } from '../../components/GoalChip'
import { SwipeableRow } from '../../components/SwipeableRow'
import { useDeleteTask, useSetTaskStatus, useUpdateTask } from '../../data/use-tasks'
import { staggerChild } from '../../components/ui/variants'
import { toneFor } from '../../lib/palette'
import { useTimer } from '../timer/useTimer'
import { PlayButton } from './TaskRow'

export function TasksListRow({
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
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const timer = useTimer()
  const goal = goals.find((item) => item.id === task.goal_id)
  const overdue = isOverdue(task, today)
  const done = task.status === 'done'
  const running = timer.active?.type === 'focus' && timer.active.task_id === task.id
  const tone = goal ? toneFor(goal.id) : overdue ? 'rose' : 'peach'
  const [confirming, setConfirming] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [editingDue, setEditingDue] = useState(false)
  const [estimate, setEstimate] = useState(task.estimate_min?.toString() ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const estimateRef = useRef<HTMLInputElement>(null)
  const dueRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEstimate(task.estimate_min?.toString() ?? '')
    setDueDate(task.due_date ?? '')
  }, [task.due_date, task.estimate_min])

  useEffect(() => {
    if (editingEstimate) estimateRef.current?.focus()
  }, [editingEstimate])

  useEffect(() => {
    if (editingDue) dueRef.current?.focus()
  }, [editingDue])

  function saveEstimate() {
    setEditingEstimate(false)
    const trimmed = estimate.trim()
    const minutes = trimmed ? Number(trimmed) : null
    if (minutes !== null && (!Number.isInteger(minutes) || minutes <= 0)) {
      setEstimate(task.estimate_min?.toString() ?? '')
      return
    }
    if (minutes === task.estimate_min || (minutes === null && task.estimate_min === null)) return
    updateTask.mutate({ id: task.id, input: { estimate_min: minutes } })
  }

  function saveDue() {
    setEditingDue(false)
    const next = dueDate || null
    if (next === task.due_date) return
    updateTask.mutate({ id: task.id, input: { due_date: next } })
  }

  const row = (
    <div
      className={`tone-${tone} chunky-soft chunky-hover flex items-center gap-2 px-3 py-1 md:gap-3 ${
        running ? 'chunky-tone !border-line' : ''
      } ${done ? 'opacity-70' : ''}`}
    >
      <input
        type="checkbox"
        checked={done}
        aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        onChange={() => setStatus.mutate({ id: task.id, status: done ? 'todo' : 'done' })}
      />
      <button type="button" onClick={onOpen} className="min-h-11 min-w-0 flex-1 text-left active:!scale-100">
        <span className={`font-medium ${done ? 'text-muted line-through decoration-2' : ''}`}>{task.title}</span>
      </button>
      {goal ? (
        <span className="hidden sm:inline-flex">
          <GoalChip title={goal.title} id={goal.id} />
        </span>
      ) : null}

      {editingEstimate ? (
        <input
          ref={estimateRef}
          type="number"
          min={1}
          step={1}
          aria-label={`Estimate for ${task.title}`}
          value={estimate}
          onChange={(event) => setEstimate(event.target.value)}
          onBlur={saveEstimate}
          onKeyDown={(event) => {
            if (event.key === 'Enter') saveEstimate()
            if (event.key === 'Escape') {
              setEstimate(task.estimate_min?.toString() ?? '')
              setEditingEstimate(false)
            }
          }}
          className="chunky-input !w-16 !px-2 text-sm tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingEstimate(true)}
          className="min-h-9 shrink-0 rounded-full px-2.5 text-xs font-semibold tabular-nums text-muted hover:bg-foreground/5 hover:text-foreground"
          aria-label={`Edit estimate for ${task.title}`}
        >
          {task.estimate_min ? `${task.estimate_min}m` : 'Add est.'}
        </button>
      )}

      {editingDue ? (
        <input
          ref={dueRef}
          type="date"
          aria-label={`Due date for ${task.title}`}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          onBlur={saveDue}
          onKeyDown={(event) => {
            if (event.key === 'Enter') saveDue()
            if (event.key === 'Escape') {
              setDueDate(task.due_date ?? '')
              setEditingDue(false)
            }
          }}
          className="chunky-input !w-auto max-w-[9.5rem] !px-2 text-sm tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingDue(true)}
          className={`min-h-9 shrink-0 rounded-full px-2.5 text-xs font-semibold tabular-nums hover:bg-foreground/5 ${
            overdue ? 'bg-overdue-surface text-overdue' : 'text-muted hover:text-foreground'
          }`}
          aria-label={`Edit due date for ${task.title}`}
        >
          {task.due_date ? (overdue ? `Overdue · ${task.due_date}` : task.due_date) : 'Add due'}
        </button>
      )}

      {!done ? (
        <PlayButton
          title={task.title}
          disabled={timer.loading || Boolean(timer.active)}
          onClick={() => void timer.startFocus(task.id)}
          className="max-sm:!hidden"
        />
      ) : null}
    </div>
  )

  return (
    <motion.li layout variants={staggerChild} exit="exit">
      <SwipeableRow
        completeLabel={done ? 'Undo' : 'Done'}
        onComplete={() => setStatus.mutate({ id: task.id, status: done ? 'todo' : 'done' })}
        onDelete={() => setConfirming(true)}
      >
        {row}
      </SwipeableRow>
      <ConfirmDialog
        open={confirming}
        title="Delete task"
        body="This cannot be undone."
        confirmLabel="Delete"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          deleteTask.mutate(task.id)
          setConfirming(false)
        }}
      />
    </motion.li>
  )
}
