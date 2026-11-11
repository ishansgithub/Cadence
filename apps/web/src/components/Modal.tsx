import { AnimatePresence, motion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { IconButton } from './ui/ChunkyButton'
import { useDialogBehavior } from './useDialogBehavior'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal(props: Props) {
  return <AnimatePresence>{props.open ? <ModalPanel {...props} /> : null}</AnimatePresence>
}

function ModalPanel({ title, onClose, children }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  useDialogBehavior(true, onClose, panelRef)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <motion.button
        type="button"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="chunky relative max-h-[90svh] w-full max-w-lg overflow-y-auto !rounded-[var(--radius-xl)] p-5"
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} size={40} />
        </div>
        <div className="mt-4">{children}</div>
      </motion.section>
    </div>
  )
}
