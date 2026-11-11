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
    <div className="cadence-enter chunky tone-butter chunky-tone mx-auto mt-3 flex w-[min(100%-2rem,28rem)] items-center justify-between gap-3 !rounded-full py-1.5 pr-1.5 pl-4 text-sm font-medium">
      <p>Update available</p>
      <button type="button" onClick={() => void update()} className="chunky-btn !min-h-9 bg-ink text-ink-foreground">
        Reload
      </button>
    </div>
  )
}
