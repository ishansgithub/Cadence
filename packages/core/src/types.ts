import { z } from 'zod'

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
