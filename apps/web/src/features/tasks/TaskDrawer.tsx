import type { Goal, Task, TaskStatus } from '@cadence/core'
import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Drawer } from '../../components/Drawer'
import { ChunkyButton } from '../../components/ui/ChunkyButton'
import { useDeleteTask, useUpdateTask } from '../../data/use-tasks'

const fieldClass = 'chunky-input mt-1.5 font-normal'
const statuses: TaskStatus[] = ['todo', 'in_progress', 'done', 'archived']

export function TaskDrawer({
  task,
  goals,
  onClose,
}: {
  task: Task | null
  goals: Goal[]
  onClose: () => void
}) {
  const [shown, setShown] = useState(task)
  if (task && task !== shown) setShown(task)

  return (
    <Drawer open={task !== null} title="Task" onClose={onClose}>
      {shown ? <TaskForm key={shown.id} task={shown} goals={goals} onClose={onClose} /> : null}
    </Drawer>
  )
}

function TaskForm({ task, goals, onClose }: { task: Task; goals: Goal[]; onClose: () => void }) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [estimate, setEstimate] = useState(task.estimate_min?.toString() ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [plannedFor, setPlannedFor] = useState(task.planned_for ?? '')
  const [goalId, setGoalId] = useState(task.goal_id ?? '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function save() {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Give the task a title.')
      return
    }
    const minutes = estimate.trim() ? Number(estimate) : null
    if (minutes !== null && (!Number.isInteger(minutes) || minutes <= 0)) {
      setError('Estimate must be a whole number of minutes.')
      return
    }
    setError(null)
    updateTask.mutate(
      {
        id: task.id,
        input: {
          title: trimmed,
          notes: notes.trim() || null,
          estimate_min: minutes,
          due_date: dueDate || null,
          planned_for: plannedFor || null,
          goal_id: goalId || null,
          status,
        },
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium" htmlFor="task-title">
        Title
        <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium" htmlFor="task-notes">
        Notes
        <textarea id="task-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium" htmlFor="task-estimate">
        Estimate (minutes)
        <input
          id="task-estimate"
          type="number"
          min="1"
          step="1"
          value={estimate}
          onChange={(event) => setEstimate(event.target.value)}
          className={fieldClass}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium" htmlFor="task-due">
        Due date
        <input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium" htmlFor="task-planned">
        Planned for
        <input
          id="task-planned"
          type="date"
          value={plannedFor}
          onChange={(event) => setPlannedFor(event.target.value)}
          className={fieldClass}
        />
      </label>
      </div>
      <label className="block text-sm font-medium" htmlFor="task-goal">
        Goal
        <select id="task-goal" value={goalId} onChange={(event) => setGoalId(event.target.value)} className={fieldClass}>
          <option value="">No goal</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium" htmlFor="task-status">
        Status
        <select
          id="task-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
          className={fieldClass}
        >
          {statuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="rounded-[var(--radius-sm)] bg-danger-surface px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <ChunkyButton variant="primary" icon="check" loading={updateTask.isPending} onClick={save}>
          {updateTask.isPending ? 'Saving…' : 'Save'}
        </ChunkyButton>
        <ChunkyButton variant="danger" icon="trash" onClick={() => setConfirming(true)}>
          Delete
        </ChunkyButton>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete task"
        body="This cannot be undone."
        confirmLabel="Delete"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          deleteTask.mutate(task.id, { onSuccess: onClose })
          setConfirming(false)
        }}
      />
    </div>
  )
}
