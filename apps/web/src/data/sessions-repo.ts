import { autoCompleteEnd, sessionSchema, sessionStartSchema, type SessionRepo } from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'

const sessionColumns =
  'id, user_id, task_id, type, planned_min, started_at, ended_at, interrupted, interrupt_reason, created_at, updated_at'

const alreadyRunning = 'You already have a session running.'

export function createSessionsRepo(client: SupabaseClient): SessionRepo {
  return {
    async getActive() {
      const { data, error } = await client
        .from('sessions')
        .select(sessionColumns)
        .is('ended_at', null)
        .maybeSingle()
      if (error) throw error
      return data ? sessionSchema.parse(data) : null
    },

    async start(input) {
      const parsed = sessionStartSchema.parse(input)
      const { data, error } = await client
        .from('sessions')
        .insert({
          type: parsed.type,
          task_id: parsed.task_id ?? null,
          planned_min: parsed.planned_min,
          started_at: new Date().toISOString(),
          ended_at: null,
          interrupted: false,
        })
        .select(sessionColumns)
        .single()
      if (error) {
        if (isUniqueViolation(error)) throw new Error(alreadyRunning)
        throw error
      }
      return sessionSchema.parse(data)
    },

    async stop(id, interrupted, reason) {
      const { data, error } = await client
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          interrupted,
          interrupt_reason: interrupted ? reason : null,
        })
        .eq('id', id)
        .is('ended_at', null)
        .select(sessionColumns)
        .single()
      if (error) throw error
      return sessionSchema.parse(data)
    },

    async complete(id) {
      const existing = await this.getActive()
      if (!existing || existing.id !== id) return null
      const { data, error } = await client
        .from('sessions')
        .update({
          ended_at: autoCompleteEnd(existing),
          interrupted: false,
          interrupt_reason: null,
        })
        .eq('id', id)
        .is('ended_at', null)
        .select(sessionColumns)
        .maybeSingle()
      if (error) throw error
      return data ? sessionSchema.parse(data) : null
    },

    async listRange(from, to) {
      const { data, error } = await client
        .from('sessions')
        .select(sessionColumns)
        .gte('started_at', from)
        .lt('started_at', to)
        .order('started_at', { ascending: true })
      if (error) throw error
      return sessionSchema.array().parse(data ?? [])
    },
  }
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === '23505'
}
