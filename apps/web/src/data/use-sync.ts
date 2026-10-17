import { useEffect, useState } from 'react'
import { getSupabase } from '../lib/supabase'
import { flushQueue } from './flush-queue'
import { pendingCount } from './local-db'

export function useSyncStatus() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && navigator.onLine === false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      const { data } = await getSupabase().auth.getSession()
      const userId = data.session?.user.id
      if (!userId || cancelled) return
      if (navigator.onLine) await flushQueue(getSupabase(), userId)
      const count = await pendingCount(userId)
      if (!cancelled) setPending(count > 0)
    }

    const onOnline = () => {
      setOffline(false)
      void refresh()
    }
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    void refresh()

    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return { offline, pending }
}
