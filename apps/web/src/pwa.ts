import { registerSW } from 'virtual:pwa-register'

type UpdateListener = (update: (() => Promise<void>) | null) => void

const listeners = new Set<UpdateListener>()
let pending: (() => Promise<void>) | null = null

const updateServiceWorker = registerSW({
  onNeedRefresh() {
    pending = updateServiceWorker
    for (const listener of listeners) listener(pending)
  },
})

export function subscribeToUpdate(listener: UpdateListener) {
  listeners.add(listener)
  listener(pending)
  return () => {
    listeners.delete(listener)
  }
}
