import { useRef, type ReactNode } from 'react'
import { useDialogBehavior } from './useDialogBehavior'

export function Drawer({
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
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" className="absolute inset-0 bg-foreground/30" aria-label="Close" onClick={onClose} />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface px-4 py-5 shadow-xl"
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
