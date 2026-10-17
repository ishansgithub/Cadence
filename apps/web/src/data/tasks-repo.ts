import { filterTasks, taskCreateSchema, taskSchema, taskUpdateSchema, type TaskRepo, type TaskStatus } from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'

const taskColumns =
  'id, user_id, goal_id, title, notes, estimate_min, due_date, planned_for, status, completed_at, created_at, updated_at'

export function createTasksRepo(client: SupabaseClient): TaskRepo {
  return {
    async list(filters) {
      let query = client.from('tasks').select(taskColumns).order('created_at', { ascending: true })
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.goalId !== undefined) {
        query =
          filters.goalId === null ? query.is('goal_id', null) : query.eq('goal_id', filters.goalId)
      }
      if (filters?.plannedFor !== undefined) {
        query =
          filters.plannedFor === null
            ? query.is('planned_for', null)
            : query.eq('planned_for', filters.plannedFor)
      }
      if (filters?.overdue) {
        if (!filters.today) throw new Error('An overdue task query needs today')
        query = query.lt('due_date', filters.today).not('status', 'in', '(done,archived)')
      }

      const { data, error } = await query
      if (error) throw error
      const tasks = taskSchema.array().parse(data ?? [])
      return filters?.search ? filterTasks(tasks, { search: filters.search }) : tasks
    },

    async get(id) {
      const { data, error } = await client.from('tasks').select(taskColumns).eq('id', id).single()
      if (error) throw error
      return taskSchema.parse(data)
    },

    async create(input) {
      const parsed = taskCreateSchema.parse(input)
      const { data, error } = await client
        .from('tasks')
        .insert({
          title: parsed.title,
          notes: emptyToNull(parsed.notes),
          estimate_min: parsed.estimate_min ?? null,
          due_date: parsed.due_date ?? null,
          planned_for: parsed.planned_for ?? null,
          goal_id: parsed.goal_id ?? null,
          status: parsed.status ?? 'todo',
          completed_at: parsed.status === 'done' ? new Date().toISOString() : null,
        })
        .select(taskColumns)
        .single()
      if (error) throw error
      return taskSchema.parse(data)
    },

    async update(id, input) {
      const parsed = taskUpdateSchema.parse(input)
      const { data, error } = await client
        .from('tasks')
        .update({
          ...(parsed.title !== undefined ? { title: parsed.title } : {}),
          ...(parsed.notes !== undefined ? { notes: emptyToNull(parsed.notes) } : {}),
          ...(parsed.estimate_min !== undefined ? { estimate_min: parsed.estimate_min } : {}),
          ...(parsed.due_date !== undefined ? { due_date: parsed.due_date } : {}),
          ...(parsed.planned_for !== undefined ? { planned_for: parsed.planned_for } : {}),
          ...(parsed.goal_id !== undefined ? { goal_id: parsed.goal_id } : {}),
          ...(parsed.status !== undefined ? completionPatch(parsed.status) : {}),
        })
        .eq('id', id)
        .select(taskColumns)
        .single()
      if (error) throw error
      return taskSchema.parse(data)
    },

    async delete(id) {
      const { error } = await client.from('tasks').delete().eq('id', id)
      if (error) throw error
    },

    async setStatus(id, status) {
      const { data, error } = await client
        .from('tasks')
        .update(completionPatch(status))
        .eq('id', id)
        .select(taskColumns)
        .single()
      if (error) throw error
      return taskSchema.parse(data)
    },

    async plan(id, date) {
      const { data, error } = await client
        .from('tasks')
        .update({ planned_for: date })
        .eq('id', id)
        .select(taskColumns)
        .single()
      if (error) throw error
      return taskSchema.parse(data)
    },
  }
}

function completionPatch(status: TaskStatus) {
  return {
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null,
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
