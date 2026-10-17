import { z } from 'zod'

export const goalStatusSchema = z.enum(['active', 'paused', 'done', 'archived'])
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'archived'])
export const goalTargetTypeSchema = z.enum(['hours_per_week', 'total_hours', 'deadline', 'none'])

export type GoalStatus = z.infer<typeof goalStatusSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type GoalTargetType = z.infer<typeof goalTargetTypeSchema>

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const nullableNumber = z.preprocess((value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    return Number(trimmed)
  }
  return value
}, z.number().nullable())

export const goalSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  target_type: goalTargetTypeSchema,
  target_value: nullableNumber,
  deadline: calendarDate.nullable(),
  status: goalStatusSchema,
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
})

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  target_type: goalTargetTypeSchema.optional(),
  target_value: z.number().nullable().optional(),
  deadline: calendarDate.nullable().optional(),
  status: goalStatusSchema.optional(),
})

export const goalUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  target_type: goalTargetTypeSchema.optional(),
  target_value: z.number().nullable().optional(),
  deadline: calendarDate.nullable().optional(),
  status: goalStatusSchema.optional(),
})

export const taskSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  goal_id: z.uuid().nullable(),
  title: z.string().min(1),
  notes: z.string().nullable(),
  estimate_min: z.number().int().nullable(),
  due_date: calendarDate.nullable(),
  planned_for: calendarDate.nullable(),
  status: taskStatusSchema,
  completed_at: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
})

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1),
  notes: z.string().trim().nullable().optional(),
  estimate_min: z.number().int().positive().nullable().optional(),
  due_date: calendarDate.nullable().optional(),
  planned_for: calendarDate.nullable().optional(),
  goal_id: z.uuid().nullable().optional(),
  status: taskStatusSchema.optional(),
})

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  notes: z.string().trim().nullable().optional(),
  estimate_min: z.number().int().positive().nullable().optional(),
  due_date: calendarDate.nullable().optional(),
  planned_for: calendarDate.nullable().optional(),
  goal_id: z.uuid().nullable().optional(),
  status: taskStatusSchema.optional(),
})

export type Goal = z.infer<typeof goalSchema>
export type GoalCreate = z.infer<typeof goalCreateSchema>
export type GoalUpdate = z.infer<typeof goalUpdateSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskCreate = z.infer<typeof taskCreateSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>

export const sessionTypeSchema = z.enum(['focus', 'short_break', 'long_break'])
export type SessionType = z.infer<typeof sessionTypeSchema>

export const sessionSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  task_id: z.uuid().nullable(),
  type: sessionTypeSchema,
  planned_min: z.number().int(),
  started_at: z.string().min(1),
  ended_at: z.string().nullable(),
  interrupted: z.boolean(),
  interrupt_reason: z.string().nullable(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
})

export const sessionStartSchema = z.object({
  type: sessionTypeSchema,
  task_id: z.uuid().nullable().optional(),
  planned_min: z.number().int().positive(),
})

export type Session = z.infer<typeof sessionSchema>
export type SessionStart = z.infer<typeof sessionStartSchema>

export const settingsSchema = z.object({
  user_id: z.uuid(),
  focus_min: z.number().int(),
  short_break_min: z.number().int(),
  long_break_min: z.number().int(),
  sessions_before_long_break: z.number().int(),
  week_starts_on: z.number().int().min(0).max(6),
  timezone: z.string().min(1),
  updated_at: z.string().min(1),
})

export type Settings = z.infer<typeof settingsSchema>

const sqlNumber = z.preprocess((value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return value
}, z.number())

const sqlInteger = z.preprocess((value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  return value
}, z.number().int())

export const dailyFocusRowSchema = z.object({
  user_id: z.uuid(),
  day: calendarDate,
  goal_id: z.uuid().nullable(),
  focus_min: sqlNumber,
  sessions: sqlInteger,
  interrupted_sessions: sqlInteger,
})

export const timeByGoalRowSchema = z.object({
  user_id: z.uuid(),
  goal_id: z.uuid().nullable(),
  week_start: calendarDate,
  focus_min: sqlNumber,
})

export const taskFocusRowSchema = z.object({
  user_id: z.uuid(),
  task_id: z.uuid(),
  goal_id: z.uuid().nullable(),
  title: z.string(),
  status: taskStatusSchema,
  estimate_min: nullableNumber,
  day: calendarDate,
  actual_min: sqlNumber,
})

export const focusHourRowSchema = z.object({
  user_id: z.uuid(),
  goal_id: z.uuid().nullable(),
  day: calendarDate,
  hour: sqlInteger,
  focus_min: sqlNumber,
})

export const interruptionRowSchema = z.object({
  user_id: z.uuid(),
  goal_id: z.uuid().nullable(),
  day: calendarDate,
  reason: z.string(),
  interruptions: sqlInteger,
})

export type DailyFocusRow = z.infer<typeof dailyFocusRowSchema>
export type TimeByGoalRow = z.infer<typeof timeByGoalRowSchema>
export type TaskFocusRow = z.infer<typeof taskFocusRowSchema>
export type FocusHourRow = z.infer<typeof focusHourRowSchema>
export type InterruptionRow = z.infer<typeof interruptionRowSchema>
