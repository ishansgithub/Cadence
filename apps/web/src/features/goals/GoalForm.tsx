import type { Goal, GoalCreate, GoalStatus, GoalTargetType } from '@cadence/core'
import { useState, type FormEvent } from 'react'

const fieldClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2'

const statuses: GoalStatus[] = ['active', 'paused', 'done', 'archived']
const targetTypes: { value: GoalTargetType; label: string }[] = [
  { value: 'none', label: 'No target' },
  { value: 'hours_per_week', label: 'Hours per week' },
  { value: 'total_hours', label: 'Total hours' },
  { value: 'deadline', label: 'Deadline' },
]

export function GoalForm({
  goal,
  pending,
  onSubmit,
}: {
  goal?: Goal
  pending: boolean
  onSubmit: (input: GoalCreate) => void
}) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [targetType, setTargetType] = useState<GoalTargetType>(goal?.target_type ?? 'none')
  const [targetValue, setTargetValue] = useState(goal?.target_value?.toString() ?? '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'active')
  const [error, setError] = useState<string | null>(null)
  const showsValue = targetType === 'hours_per_week' || targetType === 'total_hours'

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Give the goal a title.')
      return
    }
    const hours = showsValue && targetValue.trim() ? Number(targetValue) : null
    if (showsValue && (hours === null || !Number.isFinite(hours) || hours <= 0)) {
      setError('Enter the target hours.')
      return
    }
    if (targetType === 'deadline' && !deadline) {
      setError('Choose a deadline.')
      return
    }
    setError(null)
    onSubmit({
      title: trimmed,
      description: description.trim() || null,
      target_type: targetType,
      target_value: hours,
      deadline: targetType === 'deadline' ? deadline || null : null,
      status,
    })
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium" htmlFor="goal-title">
        Title
        <input id="goal-title" value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium" htmlFor="goal-description">
        Description
        <textarea
          id="goal-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="goal-target-type">
        Target
        <select
          id="goal-target-type"
          value={targetType}
          onChange={(event) => setTargetType(event.target.value as GoalTargetType)}
          className={fieldClass}
        >
          {targetTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {showsValue ? (
        <label className="block text-sm font-medium" htmlFor="goal-target-value">
          Hours
          <input
            id="goal-target-value"
            type="number"
            min="0.25"
            step="0.25"
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
            className={fieldClass}
          />
        </label>
      ) : null}
      {targetType === 'deadline' ? (
        <label className="block text-sm font-medium" htmlFor="goal-deadline">
          Deadline
          <input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className={fieldClass}
          />
        </label>
      ) : null}
      <label className="block text-sm font-medium" htmlFor="goal-status">
        Status
        <select
          id="goal-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as GoalStatus)}
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save goal'}
      </button>
    </form>
  )
}
