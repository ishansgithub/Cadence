import type { Goal, Task, TaskStatus } from '@cadence/core'
import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Drawer } from '../../components/Drawer'
import { useDeleteTask, useUpdateTask } from '../../data/use-tasks'

const fieldClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2'
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
  return (
    <Drawer open={task !== null} title="Task" onClose={onClose}>
      {task ? <TaskForm key={task.id} task={task} goals={goals} onClose={onClose} /> : null}
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
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={updateTask.isPending}
          onClick={save}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {updateTask.isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setConfirming(true)} className="rounded-lg border border-border px-3 py-2 text-sm">
          Delete
        </button>
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
