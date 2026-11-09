import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

export function AccountMenu({
  email,
  onSignOut,
}: {
  email: string | null | undefined
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const navigate = useNavigate()
  const label = email?.trim() || 'Account'

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
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="cadence-enter absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-sm"
        >
          <div className="px-2 py-2">
            <p className="truncate text-sm font-medium">{label}</p>
            <p className="mt-0.5 text-xs text-muted">Signed in</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void navigate('/settings')
            }}
            className="flex min-h-11 w-full items-center rounded-lg px-2 text-left text-sm font-medium hover:bg-background"
          >
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="flex min-h-11 w-full items-center rounded-lg px-2 text-left text-sm font-medium text-danger hover:bg-danger-surface"
          >
            Log out
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-background"
      >
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent"
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{label}</span>
        </span>
        <span className="shrink-0 text-muted" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
    </div>
  )
}
