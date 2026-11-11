import { Modal } from './Modal'
import { ChunkyButton } from './ui/ChunkyButton'

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
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <ChunkyButton onClick={onClose}>Cancel</ChunkyButton>
        <ChunkyButton variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </ChunkyButton>
      </div>
    </Modal>
  )
}
