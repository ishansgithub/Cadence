import { z } from 'zod'
import { blocklistSchema, goalSchema, sessionSchema, settingsSchema, taskSchema } from './types'

export const backupSchema = z.object({
  version: z.literal(1),
  exported_at: z.string().min(1),
  goals: z.array(goalSchema),
  tasks: z.array(taskSchema),
  sessions: z.array(sessionSchema),
  blocklists: z.array(blocklistSchema),
  settings: settingsSchema,
})

export type Backup = z.infer<typeof backupSchema>

export function backupCounts(backup: Backup) {
  return {
    goals: backup.goals.length,
    tasks: backup.tasks.length,
    sessions: backup.sessions.length,
    blocklists: backup.blocklists.length,
  }
}

export function assignBackupUser(backup: Backup, userId: string): Backup {
  return {
    ...backup,
    goals: backup.goals.map((row) => ({ ...row, user_id: userId })),
    tasks: backup.tasks.map((row) => ({ ...row, user_id: userId })),
    sessions: backup.sessions.map((row) => ({ ...row, user_id: userId })),
    blocklists: backup.blocklists.map((row) => ({ ...row, user_id: userId })),
    settings: { ...backup.settings, user_id: userId },
  }
}
