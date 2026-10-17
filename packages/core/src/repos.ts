import type { Goal, GoalCreate, GoalStatus, GoalUpdate, Settings, Task, TaskCreate, TaskStatus, TaskUpdate } from './types'

export type GoalListFilters = {
  status?: GoalStatus
}

export type TaskListFilters = {
  status?: TaskStatus
  goalId?: string | null
  plannedFor?: string | null
  overdue?: boolean
  search?: string
  today?: string
}

export interface GoalRepo {
  list(filters?: GoalListFilters): Promise<Goal[]>
  get(id: string): Promise<Goal>
  create(input: GoalCreate): Promise<Goal>
  update(id: string, input: GoalUpdate): Promise<Goal>
  archive(id: string): Promise<Goal>
}

export interface TaskRepo {
  list(filters?: TaskListFilters): Promise<Task[]>
  get(id: string): Promise<Task>
  create(input: TaskCreate): Promise<Task>
  update(id: string, input: TaskUpdate): Promise<Task>
  delete(id: string): Promise<void>
  setStatus(id: string, status: TaskStatus): Promise<Task>
  plan(id: string, date: string | null): Promise<Task>
}

export interface SettingsRepo {
  ensureForUser(userId: string, timeZone: string): Promise<Settings>
}
