import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastItem } from './toast-context'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showError = useCallback((message: string) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ showError }), [showError])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((toast) => (
          <p key={toast.id} role="alert" className="pointer-events-auto max-w-sm rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger shadow">
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
