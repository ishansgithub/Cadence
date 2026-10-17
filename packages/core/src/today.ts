import { addCalendarDays, calendarDateInTimeZone } from './dates'
import type { TaskListFilters } from './repos'
import type { Task, TaskStatus } from './types'

const closed: TaskStatus[] = ['done', 'archived']

export type TodayGroups = {
  planned: Task[]
  overdue: Task[]
  suggested: Task[]
  doneToday: Task[]
  plannedEstimateMin: number
}

export function partitionToday(tasks: Task[], today: string, timeZone: string): TodayGroups {
  const tomorrow = addCalendarDays(today, 1)
  const planned = tasks
    .filter((task) => task.planned_for === today && !closed.includes(task.status))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  const overdue = tasks.filter(
    (task) =>
      task.due_date !== null &&
      task.due_date < today &&
      !closed.includes(task.status) &&
      task.planned_for !== today,
  )
  const suggested = tasks.filter(
    (task) =>
      task.planned_for === null &&
      !closed.includes(task.status) &&
      (task.due_date === today || task.due_date === tomorrow),
  )
  const doneToday = tasks.filter((task) => task.status === 'done' && completedOnToday(task, today, timeZone))

  return {
    planned,
    overdue,
    suggested,
    doneToday,
    plannedEstimateMin: planned.reduce((sum, task) => sum + (task.estimate_min ?? 0), 0),
  }
}

export function filterTasks(tasks: Task[], filters: TaskListFilters): Task[] {
  const search = filters.search?.trim().toLowerCase()
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.goalId !== undefined && task.goal_id !== filters.goalId) return false
    if (filters.plannedFor !== undefined && task.planned_for !== filters.plannedFor) return false
    if (filters.overdue) {
      if (!filters.today || !task.due_date || task.due_date >= filters.today) return false
      if (closed.includes(task.status)) return false
    }
    if (search && !`${task.title} ${task.notes ?? ''}`.toLowerCase().includes(search)) return false
    return true
  })
}

export function isOverdue(task: Pick<Task, 'due_date' | 'status'>, today: string): boolean {
  return task.due_date !== null && task.due_date < today && !closed.includes(task.status)
}

function completedOnToday(task: Task, today: string, timeZone: string): boolean {
  if (task.planned_for === today) return true
  if (!task.completed_at) return false
  return calendarDateInTimeZone(timeZone, task.completed_at) === today
}
