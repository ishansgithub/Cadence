import { settingsSchema, type SettingsRepo } from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'

const settingsColumns =
  'user_id, focus_min, short_break_min, long_break_min, sessions_before_long_break, week_starts_on, timezone, updated_at'

export function createSettingsRepo(client: SupabaseClient): SettingsRepo {
  return {
    async ensureForUser(userId, timeZone) {
      const { error: writeError } = await client.from('settings').upsert(
        { user_id: userId, timezone: timeZone },
        { onConflict: 'user_id', ignoreDuplicates: true },
      )
      if (writeError) throw writeError

      const { data, error } = await client
        .from('settings')
        .select(settingsColumns)
        .eq('user_id', userId)
        .single()
      if (error) throw error

      return settingsSchema.parse(data)
    },
  }
}
