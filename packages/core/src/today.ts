import { addCalendarDays, calendarDateInTimeZone } from './dates'
import type { TaskDueFilter, TaskListFilters } from './repos'
import type { Task, TaskStatus } from './types'

const closed: TaskStatus[] = ['done', 'archived']

export type TodayGroups = {
  planned: Task[]
  overdue: Task[]
  doneToday: Task[]
  plannedEstimateMin: number
}

export type TaskListGroupId = 'overdue' | 'today' | 'upcoming' | 'none' | 'done'

export type TaskListGroup = {
  id: TaskListGroupId
  label: string
  tasks: Task[]
}

export function partitionToday(tasks: Task[], today: string, timeZone: string): TodayGroups {
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
  const doneToday = tasks.filter((task) => task.status === 'done' && completedOnToday(task, today, timeZone))

  return {
    planned,
    overdue,
    doneToday,
    plannedEstimateMin: planned.reduce((sum, task) => sum + (task.estimate_min ?? 0), 0),
  }
}

export function filterTasks(tasks: Task[], filters: TaskListFilters): Task[] {
  const search = filters.search?.trim().toLowerCase()
  const weekEnd = filters.today ? addCalendarDays(filters.today, 6) : null
  return tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false
    if (filters.goalId !== undefined && task.goal_id !== filters.goalId) return false
    if (filters.plannedFor !== undefined && task.planned_for !== filters.plannedFor) return false
    if (filters.overdue) {
      if (!filters.today || !task.due_date || task.due_date >= filters.today) return false
      if (closed.includes(task.status)) return false
    }
    if (filters.due && filters.due !== 'all' && filters.today) {
      if (!matchesDueFilter(task, filters.due, filters.today, weekEnd ?? filters.today)) return false
    }
    if (search && !`${task.title} ${task.notes ?? ''}`.toLowerCase().includes(search)) return false
    return true
  })
}

export function groupTasksForList(tasks: Task[], today: string): TaskListGroup[] {
  const buckets: Record<TaskListGroupId, Task[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    none: [],
    done: [],
  }

  for (const task of tasks) {
    if (task.status === 'done') {
      buckets.done.push(task)
      continue
    }
    if (task.status === 'archived') {
      buckets.done.push(task)
      continue
    }
    if (!task.due_date) {
      buckets.none.push(task)
      continue
    }
    if (task.due_date < today) buckets.overdue.push(task)
    else if (task.due_date === today) buckets.today.push(task)
    else buckets.upcoming.push(task)
  }

  const order: Array<{ id: TaskListGroupId; label: string }> = [
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'none', label: 'No due date' },
    { id: 'done', label: 'Done' },
  ]

  return order
    .map(({ id, label }) => ({
      id,
      label,
      tasks: buckets[id].sort((a, b) => {
        if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date)
        return a.created_at.localeCompare(b.created_at)
      }),
    }))
    .filter((group) => group.tasks.length > 0)
}

export function isOverdue(task: Pick<Task, 'due_date' | 'status'>, today: string): boolean {
  return task.due_date !== null && task.due_date < today && !closed.includes(task.status)
}

function matchesDueFilter(task: Task, due: TaskDueFilter, today: string, weekEnd: string): boolean {
  if (due === 'none') return task.due_date === null && !closed.includes(task.status)
  if (closed.includes(task.status)) return false
  if (due === 'overdue') return task.due_date !== null && task.due_date < today
  if (due === 'today') return task.due_date === today
  if (due === 'week') return task.due_date !== null && task.due_date >= today && task.due_date <= weekEnd
  return true
}

function completedOnToday(task: Task, today: string, timeZone: string): boolean {
  if (task.planned_for === today) return true
  if (!task.completed_at) return false
  return calendarDateInTimeZone(timeZone, task.completed_at) === today
}
