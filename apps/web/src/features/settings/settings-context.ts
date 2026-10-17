import type { Settings } from '@cadence/core'
import { createContext } from 'react'

export type SettingsContextValue = {
  settings: Settings | null
  loading: boolean
  error: string | null
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
