import type { Settings } from './types'

export interface SettingsRepo {
  ensureForUser(userId: string, timeZone: string): Promise<Settings>
}
