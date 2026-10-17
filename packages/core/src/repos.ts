import type {
  DailyFocusRow,
  FocusHourRow,
  Goal,
  GoalCreate,
  GoalStatus,
  GoalUpdate,
  InterruptionRow,
  Session,
  SessionStart,
  Settings,
  SettingsUpdate,
  Task,
  TaskCreate,
  TaskFocusRow,
  TaskStatus,
  TaskUpdate,
  TimeByGoalRow,
} from './types'

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

export interface SessionRepo {
  getActive(): Promise<Session | null>
  start(input: SessionStart): Promise<Session>
  stop(id: string, interrupted: boolean, reason: string | null): Promise<Session>
  complete(id: string): Promise<Session | null>
  listRange(from: string, to: string): Promise<Session[]>
}

export interface SettingsRepo {
  ensureForUser(userId: string, timeZone: string): Promise<Settings>
  update(input: SettingsUpdate): Promise<Settings>
}

export type ReportRows = {
  daily: DailyFocusRow[]
  timeByGoal: TimeByGoalRow[]
  taskFocus: TaskFocusRow[]
  hours: FocusHourRow[]
  interruptions: InterruptionRow[]
}

export interface ReportRepo {
  load(): Promise<ReportRows>
}
