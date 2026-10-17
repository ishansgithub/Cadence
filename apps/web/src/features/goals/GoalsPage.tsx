import {
  countTasksForGoal,
  formatGoalTarget,
  goalFocusMinutes,
  goalProgress,
  todayInTimeZone,
  weekStartOn,
  type Goal,
  type GoalStatus,
} from '@cadence/core'
import { useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { GoalProgress } from '../../components/GoalProgress'
import { Modal } from '../../components/Modal'
import { QueryState } from '../../components/QueryState'
import { StatusBadge } from '../../components/StatusBadge'
import { useArchiveGoal, useCreateGoal, useGoals, useUpdateGoal } from '../../data/use-goals'
import { useReports } from '../../data/use-reports'
import { useTasks } from '../../data/use-tasks'
import { useSettings } from '../settings/useSettings'
import { GoalForm } from './GoalForm'

const filters: Array<GoalStatus | 'all'> = ['all', 'active', 'paused', 'done', 'archived']

export function GoalsPage() {
  const goals = useGoals()
  const tasks = useTasks()
  const reports = useReports()
  const settings = useSettings()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const archiveGoal = useArchiveGoal()
  const [filter, setFilter] = useState<GoalStatus | 'all'>('active')
  const [editing, setEditing] = useState<Goal | null>(null)
  const [creating, setCreating] = useState(false)

  const visible = (goals.data ?? []).filter((goal) => filter === 'all' || goal.status === filter)
  const modalOpen = creating || editing !== null
  const pending = createGoal.isPending || updateGoal.isPending

  function closeModal() {
    setCreating(false)
    setEditing(null)
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setCreating(true)
          }}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
        >
          New goal
        </button>
      </div>
      <label className="mt-4 block text-sm" htmlFor="goal-filter">
        Status
        <select
          id="goal-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as GoalStatus | 'all')}
          className="mt-1 rounded-lg border border-border bg-background px-3 py-2"
        >
          {filters.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-6">
        <QueryState
          isPending={goals.isPending || tasks.isPending}
          isError={goals.isError || tasks.isError}
          error={goals.error ?? tasks.error}
          onRetry={() => {
            void goals.refetch()
            void tasks.refetch()
          }}
          label="Loading goals"
        >
          {visible.length === 0 ? (
            <EmptyState title="No goals here" body="Create a goal, or choose another status filter." />
          ) : (
            <ul className="space-y-3">
              {visible.map((goal) => {
                const counts = countTasksForGoal(tasks.data ?? [], goal.id)
                const target = formatGoalTarget(goal)
                const today = settings.settings
                  ? todayInTimeZone(settings.settings.timezone, new Date())
                  : todayInTimeZone('UTC', new Date())
                const week = weekStartOn(today, settings.settings?.week_starts_on ?? 1)
                const minutes = goalFocusMinutes(
                  reports.data?.timeByGoal ?? [],
                  goal.id,
                  goal.target_type === 'hours_per_week' ? week : null,
                )
                const progress = reports.isError
                  ? { progress: 0, label: 'Focus time unavailable' }
                  : reports.isPending
                    ? { progress: 0, label: 'Loading focus time' }
                    : goalProgress(goal, minutes, today)
                return (
                  <li key={goal.id} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold">{goal.title}</h2>
                      <StatusBadge status={goal.status} />
                    </div>
                    {target ? <p className="mt-1 text-sm text-muted">{target}</p> : null}
                    <p className="mt-2 text-sm text-muted">
                      {counts.open} open · {counts.done} done
                    </p>
                    <div className="mt-3">
                      <GoalProgress progress={progress.progress} label={progress.label} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCreating(false)
                          setEditing(goal)
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm"
                      >
                        Edit
                      </button>
                      {goal.status === 'archived' ? (
                        <button
                          type="button"
                          onClick={() => updateGoal.mutate({ id: goal.id, input: { status: 'active' } })}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm"
                        >
                          Unarchive
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveGoal.mutate(goal.id)}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </QueryState>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit goal' : 'New goal'} onClose={closeModal}>
        <GoalForm
          key={editing?.id ?? 'new'}
          goal={editing ?? undefined}
          pending={pending}
          onSubmit={(input) => {
            if (editing) {
              updateGoal.mutate({ id: editing.id, input }, { onSuccess: closeModal })
            } else {
              createGoal.mutate(input, { onSuccess: closeModal })
            }
          }}
        />
      </Modal>
    </section>
  )
}
