import { Modal } from './Modal'

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-muted">{body}</p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
