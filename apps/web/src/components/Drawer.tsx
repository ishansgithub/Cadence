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
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button
        type="button"
        className="cadence-scrim absolute inset-0 bg-foreground/30 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="cadence-drawer relative flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl border border-border bg-surface px-4 py-5 sm:h-full sm:max-h-none sm:rounded-none sm:border-0 sm:border-l"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-border px-3 text-sm"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  )
}
