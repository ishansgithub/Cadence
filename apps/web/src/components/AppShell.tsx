import { appName } from '@cadence/core'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useSyncStatus } from '../data/use-sync'
import { useAuth } from '../features/auth/useAuth'
import { useSettings } from '../features/settings/useSettings'
import { MiniTimerBar } from '../features/timer/MiniTimerBar'
import { useTimer } from '../features/timer/useTimer'
import { AccountMenu } from './AccountMenu'
import { Modal } from './Modal'
import { UpdatePrompt } from './UpdatePrompt'

const navItems = [
  { to: '/today', label: 'Today' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/goals', label: 'Goals' },
  { to: '/reports', label: 'Reports' },
]

function navClass(isActive: boolean, layout: 'side' | 'tab') {
  const base =
    layout === 'side'
      ? 'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium'
      : 'flex min-h-11 flex-1 flex-col items-center justify-center px-1 py-2 text-xs font-medium'
  return isActive
    ? `${base} bg-accent-muted text-accent`
    : `${base} text-muted hover:bg-background hover:text-foreground`
}

function Navigation({ layout }: { layout: 'side' | 'tab' }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive, layout)}>
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

export function AppShell() {
  return <ShellFrame />
}

function ShellFrame() {
  const { user, signOut } = useAuth()
  const { error } = useSettings()
  const { active, startFocus, pauseTimer, resumeTimer, paused, skipBreak } = useTimer()
  const { offline, pending } = useSyncStatus()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let waitingForNav = false
    let clearWait = 0

    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (waitingForNav) {
        waitingForNav = false
        const path = { t: '/today', g: '/goals', r: '/reports', s: '/settings', f: '/focus' }[event.key]
        if (path) {
          event.preventDefault()
          navigate(path)
        }
        return
      }

      if (event.key === 'g') {
        waitingForNav = true
        clearWait = window.setTimeout(() => {
          waitingForNav = false
        }, 800)
        return
      }
      if (event.key === '?') {
        event.preventDefault()
        setHelpOpen(true)
        return
      }
      if (event.key === 'n') {
        document.getElementById('quick-add')?.focus()
        return
      }
      if (event.key === ' ' && !(target instanceof HTMLElement && target.closest('button, a'))) {
        event.preventDefault()
        if (!active) void startFocus(null)
        else if (paused) resumeTimer()
        else pauseTimer()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(clearWait)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, navigate, pauseTimer, paused, resumeTimer, skipBreak, startFocus])

  async function onSignOut() {
    setSignOutError(null)
    try {
      await signOut()
    } catch (caught) {
      setSignOutError(caught instanceof Error ? caught.message : 'Could not sign out.')
    }
  }

  return (
    <div className="min-h-svh md:grid md:h-svh md:grid-cols-[15rem_1fr] md:overflow-hidden">
      <aside className="hidden border-r border-border bg-surface md:flex md:h-full md:flex-col md:p-3">
        <div className="flex min-h-11 items-center px-3">
          <p className="text-lg font-semibold tracking-tight">{appName}</p>
        </div>
        <nav aria-label="Primary" className="mt-4 flex-1 space-y-1">
          <Navigation layout="side" />
        </nav>
        <div className="mt-auto space-y-2 border-t border-border pt-3">
          <MiniTimerBar layout="sidebar" />
          <AccountMenu email={user?.email} onSignOut={() => void onSignOut()} />
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="cadence-scrim absolute inset-0 bg-foreground/30"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="cadence-drawer absolute inset-y-0 left-0 flex w-[16rem] flex-col border-r border-border bg-surface p-3">
            <div className="flex min-h-11 items-center justify-between px-3">
              <p className="text-lg font-semibold tracking-tight">{appName}</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-11 rounded-lg px-2 text-sm text-muted"
              >
                Close
              </button>
            </div>
            <nav
              aria-label="Primary"
              className="mt-4 flex-1 space-y-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Navigation layout="side" />
            </nav>
            <div className="mt-auto space-y-2 border-t border-border pt-3">
              <AccountMenu email={user?.email} onSignOut={() => void onSignOut()} />
            </div>
          </aside>
        </div>
      ) : null}

      <div
        className={`cadence-scroll flex min-h-svh flex-col md:min-h-0 md:overflow-y-auto ${active ? 'pb-28' : 'pb-16'} md:pb-0`}
      >
        <UpdatePrompt />
        <div className="flex items-center gap-2 px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm font-medium"
            aria-label="Open menu"
          >
            Menu
          </button>
          <p className="text-lg font-semibold tracking-tight">{appName}</p>
        </div>
        {pending ? (
          <p className="border-b border-warning/30 bg-warning-surface px-4 py-2 text-sm text-warning md:px-6">
            Offline, changes pending
          </p>
        ) : offline ? (
          <p className="border-b border-warning/30 bg-warning-surface px-4 py-2 text-sm text-warning md:px-6">
            Offline
          </p>
        ) : null}
        <div className="md:hidden">
          <MiniTimerBar layout="mobile" />
        </div>
        {error ? (
          <p role="alert" className="bg-danger-surface px-4 py-2 text-sm text-danger md:px-6">
            {error}
          </p>
        ) : null}
        {signOutError ? (
          <p role="alert" className="bg-danger-surface px-4 py-2 text-sm text-danger md:px-6">
            {signOutError}
          </p>
        ) : null}
        <main className="flex-1 px-4 py-6 md:px-6">
          <Outlet />
        </main>
        <Modal open={helpOpen} title="Shortcuts" onClose={() => setHelpOpen(false)}>
          <ul className="space-y-2 text-sm">
            <li>`n` new task</li>
            <li>`space` start, pause, or resume the timer</li>
            <li>`g` then `t`, `g`, `r`, `s`, or `f` for Today, Goals, Reports, Settings, Focus</li>
            <li>`?` this list</li>
          </ul>
        </Modal>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
      >
        <Navigation layout="tab" />
      </nav>
    </div>
  )
}
