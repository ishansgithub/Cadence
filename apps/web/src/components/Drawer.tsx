import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconButton } from './ui/ChunkyButton'
import { useDialogBehavior } from './useDialogBehavior'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

function useIsWide() {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 640px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)')
    const onChange = () => setWide(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return wide
}

export function Drawer(props: Props) {
  return <AnimatePresence>{props.open ? <DrawerPanel {...props} /> : null}</AnimatePresence>
}

function DrawerPanel({ title, onClose, children }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  const wide = useIsWide()
  useDialogBehavior(true, onClose, panelRef)
  const hidden = wide ? { x: '105%', opacity: 1 } : { y: '100%', opacity: 1 }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end sm:p-3">
      <motion.button
        type="button"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="chunky relative flex max-h-[90svh] w-full max-w-md flex-col overflow-y-auto !rounded-b-none !rounded-t-[var(--radius-xl)] px-5 py-5 sm:h-full sm:max-h-none sm:!rounded-[var(--radius-xl)]"
        initial={hidden}
        animate={{ x: 0, y: 0 }}
        exit={hidden}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
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
