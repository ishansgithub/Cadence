import { useState } from 'react'
import { interruptReasons } from './timer-context'

export function InterruptSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string | null) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [custom, setCustom] = useState('')

  if (!open) return null

  function submit(reason: string | null) {
    onConfirm(reason)
    setSelected(null)
    setCustom('')
  }

  const reason = custom.trim() || selected

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="cadence-scrim absolute inset-0 bg-foreground/30 backdrop-blur-[1px]"
        aria-label="Skip and close"
        onClick={() => submit(null)}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Interruption reason"
        className="cadence-sheet relative w-full max-w-md rounded-t-2xl border border-border bg-surface p-4 sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold tracking-tight">What interrupted this session?</h2>
        <p className="mt-1 text-sm text-muted">Optional — helps you see patterns later.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {interruptReasons.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setSelected(item)
                if (item !== 'Other') setCustom('')
              }}
              className={`min-h-11 rounded-xl border px-3 text-sm ${
                selected === item
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border bg-background text-foreground'
              }`}
            >
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
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => submit(reason)}
            className="min-h-11 flex-1 rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => submit(null)}
            className="min-h-11 flex-1 rounded-lg border border-border px-3 text-sm font-medium"
          >
            Skip
          </button>
        </div>
        <button type="button" onClick={onClose} className="sr-only">
          Close
        </button>
      </section>
    </div>
  )
}
