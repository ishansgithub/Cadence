import {
  goalCreateSchema,
  goalSchema,
  goalUpdateSchema,
  type GoalRepo,
} from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'

const goalColumns =
  'id, user_id, title, description, target_type, target_value, deadline, status, created_at, updated_at'

export function createGoalsRepo(client: SupabaseClient): GoalRepo {
  return {
    async list(filters) {
      let query = client.from('goals').select(goalColumns).order('created_at', { ascending: true })
      if (filters?.status) query = query.eq('status', filters.status)
      const { data, error } = await query
      if (error) throw error
      return goalSchema.array().parse(data ?? [])
    },

    async get(id) {
      const { data, error } = await client.from('goals').select(goalColumns).eq('id', id).single()
      if (error) throw error
      return goalSchema.parse(data)
    },

    async create(input) {
      const parsed = goalCreateSchema.parse(input)
      const { data, error } = await client
        .from('goals')
        .insert(goalPayload(parsed))
        .select(goalColumns)
        .single()
      if (error) throw error
      return goalSchema.parse(data)
    },

    async update(id, input) {
      const parsed = goalUpdateSchema.parse(input)
      const { data, error } = await client
        .from('goals')
        .update(goalPayload(parsed))
        .eq('id', id)
        .select(goalColumns)
        .single()
      if (error) throw error
      return goalSchema.parse(data)
    },

    async archive(id) {
      const { data, error } = await client
        .from('goals')
        .update({ status: 'archived' })
        .eq('id', id)
        .select(goalColumns)
        .single()
      if (error) throw error
      return goalSchema.parse(data)
    },
  }
}

function goalPayload(input: {
  title?: string
  description?: string | null
  target_type?: 'hours_per_week' | 'total_hours' | 'deadline' | 'none'
  target_value?: number | null
  deadline?: string | null
  status?: 'active' | 'paused' | 'done' | 'archived'
}) {
  const targetType = input.target_type
  const keepsValue = targetType === 'hours_per_week' || targetType === 'total_hours'
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: emptyToNull(input.description) } : {}),
    ...(targetType !== undefined ? { target_type: targetType } : {}),
    ...(input.target_value !== undefined || targetType !== undefined
      ? { target_value: keepsValue ? (input.target_value ?? null) : null }
      : {}),
    ...(input.deadline !== undefined ? { deadline: input.deadline } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
