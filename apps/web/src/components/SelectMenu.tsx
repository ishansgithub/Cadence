import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './ui/Icon'

export type SelectOption = {
  value: string
  label: string
}

export function SelectMenu({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="mt-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border-2 border-border bg-surface px-3.5 text-left text-sm hover:border-line aria-expanded:border-line aria-expanded:shadow-[2px_4px_0_0_var(--sand-slab)]"
      >
        <span className="min-w-0 truncate">{selected?.label ?? 'Select'}</span>
        <span className="shrink-0 text-muted" aria-hidden>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} strokeWidth={2.4} />
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="cadence-enter chunky absolute z-30 mt-2 max-h-64 w-full overflow-y-auto !rounded-[var(--radius-md)] p-1.5"
        >
          {options.map((option) => {
            const active = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex min-h-11 w-full items-center rounded-[10px] px-3 text-left text-sm ${
                    active ? 'bg-ink font-semibold text-ink-foreground' : 'hover:bg-foreground/5'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
