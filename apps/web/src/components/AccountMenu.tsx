import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Icon } from './ui/Icon'

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
          className="cadence-enter chunky absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden !rounded-[var(--radius-md)] p-2"
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
            className="flex min-h-11 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-sm font-medium hover:bg-foreground/5"
          >
            <Icon name="settings" size={17} />
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-sm font-medium text-danger hover:bg-danger-surface"
          >
            <Icon name="logout" size={17} />
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
        aria-label={`Account: ${label}`}
        className="chunky-btn tone-peach !size-11 !p-0 bg-tone"
      >
        <span
          aria-hidden
          className="font-display text-base font-bold"
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
      </button>
    </div>
  )
}
