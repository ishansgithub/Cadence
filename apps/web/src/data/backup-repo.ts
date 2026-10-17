import {
  assignBackupUser,
  backupSchema,
  blocklistSchema,
  goalSchema,
  sessionSchema,
  settingsSchema,
  taskSchema,
  type Backup,
} from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { currentUserId } from './account'

export async function exportBackup(client: SupabaseClient): Promise<Backup> {
  const userId = await currentUserId(client)
  const [goals, tasks, sessions, blocklists, settings] = await Promise.all([
    readTable(client, 'goals', goalSchema),
    readTable(client, 'tasks', taskSchema),
    readTable(client, 'sessions', sessionSchema),
    readTable(client, 'blocklists', blocklistSchema),
    client.from('settings').select('*').eq('user_id', userId).single(),
  ])
  if (settings.error) throw settings.error
  return backupSchema.parse({
    version: 1,
    exported_at: new Date().toISOString(),
    goals,
    tasks,
    sessions,
    blocklists,
    settings: settingsSchema.parse(settings.data),
  })
}

export async function importBackup(client: SupabaseClient, backup: Backup) {
  const userId = await currentUserId(client)
  const owned = assignBackupUser(backup, userId)
  await upsertRows(client, 'goals', owned.goals)
  await upsertRows(client, 'tasks', owned.tasks)
  await upsertRows(client, 'sessions', owned.sessions)
  await upsertRows(client, 'blocklists', owned.blocklists)
  const { error } = await client.from('settings').upsert(owned.settings, { onConflict: 'user_id' })
  if (error) throw error
}

async function readTable<T>(
  client: SupabaseClient,
  table: string,
  schema: { array: () => { parse: (value: unknown) => T[] } },
): Promise<T[]> {
  const { data, error } = await client.from(table).select('*')
  if (error) throw error
  return schema.array().parse(data ?? [])
}

async function upsertRows(client: SupabaseClient, table: string, rows: unknown[]) {
  if (rows.length === 0) return
  const { error } = await client.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw error
}
