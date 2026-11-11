import { matchGoal, parseQuickAdd, type Goal } from '@cadence/core'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { GoalChip } from '../../components/GoalChip'
import { Icon } from '../../components/ui/Icon'
import { useToast } from '../../components/useToast'
import { emojiFor } from '../../lib/palette'
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
      <label className="sr-only" htmlFor="quick-add">
        Quick add
      </label>
      <div className="tone-peach group relative">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border-2 border-line bg-tone transition-transform duration-300 ease-[var(--ease-spring)] group-focus-within:rotate-90"
        >
          <Icon name="plus" size={18} strokeWidth={2.6} />
        </span>
        <input
          ref={inputRef}
          id="quick-add"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Title  #goal  ~30m  !tomorrow"
          autoComplete="off"
          className="chunky-input !min-h-13 !rounded-full !border-line !pr-24 !pl-14 text-base shadow-[3px_5px_0_0_var(--tone-slab)] focus:!shadow-[4px_7px_0_0_var(--tone-slab)]"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md border-[1.5px] border-border px-1.5 text-xs text-muted sm:block">
          Enter ↵
        </kbd>
      </div>
      {picked ? (
        <p className="cadence-enter mt-2 ml-4 text-xs text-muted">
          Linked to <GoalChip title={picked.title} id={picked.id} />
        </p>
      ) : (
        <p className="mt-2 ml-4 hidden text-xs text-muted sm:block">
          Try <code className="font-semibold text-foreground">#goal</code> to link,{' '}
          <code className="font-semibold text-foreground">~30m</code> to estimate,{' '}
          <code className="font-semibold text-foreground">!tomorrow</code> to set a due date.
        </p>
      )}
      {suggestions.length > 0 ? (
        <ul className="cadence-enter chunky absolute z-30 mt-2 w-full overflow-hidden !rounded-[var(--radius-md)] p-1.5">
          {suggestions.map((goal) => (
            <li key={goal.id}>
              <button
                type="button"
                onClick={() => chooseGoal(goal)}
                className="flex min-h-11 w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm hover:bg-foreground/5"
              >
                <span aria-hidden>{emojiFor(goal.id)}</span>
                {goal.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}
