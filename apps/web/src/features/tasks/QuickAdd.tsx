import { matchGoal, parseQuickAdd, type Goal } from '@cadence/core'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useToast } from '../../components/useToast'
import { useCreateTask } from '../../data/use-tasks'

export function QuickAdd({
  goals,
  today,
  plannedFor,
}: {
  goals: Goal[]
  today: string
  plannedFor: string | null
}) {
  const createTask = useCreateTask()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [pickedGoalId, setPickedGoalId] = useState<string | null>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return
      if (document.querySelector('[role="dialog"]')) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const partial = value.match(/#([^\s#]*)$/)?.[1] ?? ''
  const suggestions =
    partial.length > 0
      ? goals
          .filter(
            (goal) => goal.status !== 'archived' && goal.title.toLowerCase().includes(partial.toLowerCase()),
          )
          .slice(0, 6)
      : []

  function chooseGoal(goal: Goal) {
    setPickedGoalId(goal.id)
    setValue((current) => current.replace(/#([^\s#]*)$/, '').replace(/\s+/g, ' ').trim())
    inputRef.current?.focus()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsed = parseQuickAdd(value, today)
    if (!parsed.title) {
      toast.showError('Add a title before the shortcuts.')
      return
    }

    let goalId = pickedGoalId
    if (parsed.goalQuery) {
      const match = matchGoal(goals, parsed.goalQuery)
      if (match === 'none') {
        toast.showError(`No goal named "${parsed.goalQuery}". The task was saved without one.`)
        goalId = null
      } else if (match === 'ambiguous') {
        toast.showError(`More than one goal matches "${parsed.goalQuery}". The task was saved without one.`)
        goalId = null
      } else {
        goalId = match.id
      }
    }

    createTask.mutate({
      title: parsed.title,
      goal_id: goalId,
      estimate_min: parsed.estimateMin,
      due_date: parsed.dueDate,
      planned_for: plannedFor,
    })
    setValue('')
    setPickedGoalId(null)
  }

  const picked = goals.find((goal) => goal.id === pickedGoalId)

  return (
    <form onSubmit={submit} className="relative">
      <label className="block text-sm font-medium" htmlFor="quick-add">
        Quick add
        <input
          ref={inputRef}
          id="quick-add"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Title  #goal  ~30m  !tomorrow"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      {picked ? <p className="mt-1 text-xs text-muted">Linked to {picked.title}</p> : null}
      {suggestions.length > 0 ? (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow">
          {suggestions.map((goal) => (
            <li key={goal.id}>
              <button type="button" onClick={() => chooseGoal(goal)} className="block w-full px-3 py-2 text-left text-sm">
                {goal.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}
