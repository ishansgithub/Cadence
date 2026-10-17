import { useRef, type ReactNode } from 'react'
import { useDialogBehavior } from './useDialogBehavior'

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLElement>(null)
  useDialogBehavior(open, onClose, panelRef)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-foreground/30" aria-label="Close" onClick={onClose} />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-4 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-2 py-1 text-sm">
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  )
}
