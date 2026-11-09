import { useEffect, useId, useRef, useState } from 'react'

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
        className="mt-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm hover:border-accent/45"
      >
        <span className="min-w-0 truncate">{selected?.label ?? 'Select'}</span>
        <span className="shrink-0 text-muted" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="cadence-enter absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1"
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
                  className={`flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm ${
                    active ? 'bg-accent-muted font-medium text-accent' : 'hover:bg-background'
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
