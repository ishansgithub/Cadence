import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { useDialogBehavior } from '../../components/useDialogBehavior'
import { ChunkyButton } from '../../components/ui/ChunkyButton'
import { interruptReasons } from './timer-context'

const reasonEmoji: Record<string, string> = {
  Distracted: '🫠',
  'Urgent task': '🚨',
  'Break needed': '☕',
  Other: '✏️',
}

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string | null) => void
}

export function InterruptSheet({ open, onClose, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {open ? <InterruptPanel key="interrupt" onClose={onClose} onConfirm={onConfirm} /> : null}
    </AnimatePresence>
  )
}

function InterruptPanel({ onClose, onConfirm }: Omit<Props, 'open'>) {
  const panelRef = useRef<HTMLElement>(null)
  const done = useRef(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const reason = custom.trim() || selected

  function finish(next: string | null) {
    if (done.current) return
    done.current = true
    onConfirm(next)
  }

  // Esc and scrim skip the reason (stop without one), matching the Skip button.
  useDialogBehavior(true, () => finish(null), panelRef)

  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-foreground/25 backdrop-blur-[3px]"
        aria-label="Skip and close"
        onClick={() => finish(null)}
      />
      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Interruption reason"
        className="chunky tone-peach relative z-10 w-full max-w-md !rounded-[var(--radius-xl)] p-5"
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        <h2 className="text-xl font-bold">What interrupted this session?</h2>
        <p className="mt-1 text-sm text-muted">Optional. It helps you spot patterns later.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {interruptReasons.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={selected === item}
              onClick={() => {
                setSelected(item)
                if (item !== 'Other') setCustom('')
              }}
              className="pill-toggle !min-h-11 !text-sm"
            >
              <span aria-hidden>{reasonEmoji[item] ?? '•'}</span>
              {item}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-medium" htmlFor="interrupt-custom">
          Custom note
          <input
            id="interrupt-custom"
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value)
              setSelected('Other')
            }}
            placeholder="Optional"
            className="chunky-input mt-1.5 text-sm font-normal"
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <ChunkyButton variant="primary" className="flex-1" onClick={() => finish(reason)}>
            Save
          </ChunkyButton>
          <ChunkyButton className="flex-1" onClick={() => finish(null)}>
            Skip
          </ChunkyButton>
        </div>
        <button type="button" onClick={onClose} className="sr-only">
          Close without stopping
        </button>
      </motion.section>
    </motion.div>
  )
}
