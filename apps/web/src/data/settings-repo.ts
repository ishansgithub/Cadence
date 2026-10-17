import { settingsSchema, settingsUpdateSchema, type Settings, type SettingsRepo } from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isConnectivityError } from './connectivity'
import { cacheGet, cacheSet } from './local-db'

const settingsColumns =
  'user_id, focus_min, short_break_min, long_break_min, sessions_before_long_break, week_starts_on, timezone, sound_enabled, notifications_enabled, updated_at'

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

      const settings = settingsSchema.parse(data)
      await cacheSet(`${userId}:settings`, settings)
      return settings
    },

    async update(input) {
      const parsed = settingsUpdateSchema.parse(input)
      const { data: auth, error: authError } = await client.auth.getSession()
      if (authError) throw authError
      const userId = auth.session?.user.id
      if (!userId) throw new Error('Sign in before changing settings.')
      const { data, error } = await client
        .from('settings')
        .update(parsed)
        .eq('user_id', userId)
        .select(settingsColumns)
        .single()
      if (error) throw error
      const settings = settingsSchema.parse(data)
      await cacheSet(`${userId}:settings`, settings)
      return settings
    },
  }
}

export async function cachedSettings(userId: string): Promise<Settings | null> {
  return cacheGet<Settings>(`${userId}:settings`)
}

export { isConnectivityError }
