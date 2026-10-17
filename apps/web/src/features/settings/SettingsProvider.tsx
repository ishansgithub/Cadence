import { resolveTimeZone, type Settings } from '@cadence/core'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createSettingsRepo } from '../../data/settings-repo'
import { getSupabase } from '../../lib/supabase'
import { settingsErrorMessage } from '../auth/auth-errors'
import { useAuth } from '../auth/useAuth'
import { SettingsContext } from './settings-context'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const timeZone = resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    createSettingsRepo(getSupabase())
      .ensureForUser(userId, timeZone)
      .then((row) => {
        if (!cancelled) setSettings(row)
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(settingsErrorMessage(caught))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const value = useMemo(() => ({ settings, loading, error }), [settings, loading, error])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
