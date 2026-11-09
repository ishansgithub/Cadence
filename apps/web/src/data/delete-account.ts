import type { SupabaseClient } from '@supabase/supabase-js'
import { currentUserId } from './account'

/** Deletes Cadence rows for the signed-in user, then signs out. Auth user may remain until a server function exists. */
export async function deleteCadenceData(client: SupabaseClient) {
  const userId = await currentUserId(client)
  const tables = ['sessions', 'tasks', 'goals', 'blocklists', 'settings'] as const
  for (const table of tables) {
    const { error } = await client.from(table).delete().eq('user_id', userId)
    if (error) throw error
  }
  const { error } = await client.auth.signOut()
  if (error) throw error
}
