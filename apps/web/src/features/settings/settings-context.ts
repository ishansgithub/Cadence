import type { Settings, SettingsUpdate } from '@cadence/core'
import { createContext } from 'react'

export type SettingsContextValue = {
  settings: Settings | null
  loading: boolean
  error: string | null
  save: (input: SettingsUpdate) => Promise<void>
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
