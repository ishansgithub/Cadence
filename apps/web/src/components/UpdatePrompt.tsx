import { useEffect, useState } from 'react'
import { subscribeToUpdate } from '../pwa'

export function UpdatePrompt() {
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToUpdate(setUpdate)
    return unsubscribe
  }, [])

  if (!update) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-accent px-4 py-2 text-sm text-accent-foreground">
      <p>Update available</p>
      <button type="button" onClick={() => void update()} className="min-h-11 rounded-lg bg-surface px-3 text-foreground">
        Reload
      </button>
    </div>
  )
}
