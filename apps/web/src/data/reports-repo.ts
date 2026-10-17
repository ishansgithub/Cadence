import {
  dailyFocusRowSchema,
  focusHourRowSchema,
  interruptionRowSchema,
  taskFocusRowSchema,
  timeByGoalRowSchema,
  type ReportRepo,
} from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'

async function readView<T>(
  client: SupabaseClient,
  view: string,
  schema: { parse: (value: unknown) => T },
): Promise<T[]> {
  const { data, error } = await client.from(view).select('*')
  if (error) throw error
  return (data ?? []).map((row) => schema.parse(row))
}

export function createReportsRepo(client: SupabaseClient): ReportRepo {
  return {
    async load() {
      const [daily, timeByGoal, taskFocus, hours, interruptions] = await Promise.all([
        readView(client, 'daily_focus_local', dailyFocusRowSchema),
        readView(client, 'time_by_goal_local', timeByGoalRowSchema),
        readView(client, 'task_focus_by_day', taskFocusRowSchema),
        readView(client, 'focus_by_hour_local', focusHourRowSchema),
        readView(client, 'interruptions_local', interruptionRowSchema),
      ])
      return { daily, timeByGoal, taskFocus, hours, interruptions }
    },
  }
}
