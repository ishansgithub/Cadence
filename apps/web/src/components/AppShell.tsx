import { appName, formatCountdown, remainingSeconds } from '@cadence/core'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useSyncStatus } from '../data/use-sync'
import { useAuth } from '../features/auth/useAuth'
import { SettingsProvider } from '../features/settings/SettingsProvider'
import { ThemeToggle } from '../features/settings/ThemeToggle'
import { useSettings } from '../features/settings/useSettings'
import { TimerProvider } from '../features/timer/TimerProvider'
import { TimerTitle } from '../features/timer/TimerTitle'
import { useTimer } from '../features/timer/useTimer'
import { Modal } from './Modal'
import { UpdatePrompt } from './UpdatePrompt'

const navItems = [
  { to: '/today', label: 'Today' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/goals', label: 'Goals' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

function navClass(isActive: boolean, layout: 'side' | 'tab') {
  const base =
    layout === 'side'
      ? 'block min-h-11 rounded-lg px-3 py-2 text-sm font-medium'
      : 'flex min-h-11 flex-1 flex-col items-center justify-center px-1 py-2 text-xs font-medium'
  return isActive ? `${base} bg-accent text-accent-foreground` : `${base} text-muted hover:text-foreground`
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
  const { user } = useAuth()

  return (
    <SettingsProvider key={user?.id}>
      <TimerProvider>
        <TimerTitle />
        <ShellFrame />
      </TimerProvider>
    </SettingsProvider>
  )
}

const miniLabels = {
  focus: 'Focus',
  short_break: 'Short break',
  long_break: 'Long break',
} as const

function ShellFrame() {
  const { user, signOut } = useAuth()
  const { error } = useSettings()
  const { active, now, startFocus, stopFocus, skipBreak } = useTimer()
  const { offline, pending } = useSyncStatus()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

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
        const path = { t: '/today', g: '/goals', r: '/reports', s: '/settings' }[event.key]
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
        else if (active.type === 'focus') void stopFocus('Other')
        else void skipBreak()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(clearWait)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, navigate, skipBreak, startFocus, stopFocus])

  async function onSignOut() {
    setSignOutError(null)
    try {
      await signOut()
    } catch (caught) {
      setSignOutError(caught instanceof Error ? caught.message : 'Could not sign out.')
    }
  }

  return (
    <div className="min-h-svh md:grid md:grid-cols-[13.5rem_1fr]">
      <aside className="hidden border-r border-border bg-surface md:flex md:flex-col md:px-3 md:py-6">
        <p className="px-3 font-serif text-lg tracking-wide">{appName}</p>
        <nav aria-label="Primary" className="mt-8 space-y-1">
          <Navigation layout="side" />
        </nav>
      </aside>

      <div className={`flex min-h-svh flex-col ${active ? 'pb-28' : 'pb-16'} md:pb-0`}>
        <UpdatePrompt />
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="font-serif text-lg md:hidden">{appName}</p>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
          <p className="truncate text-sm text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm"
          >
            Sign out
          </button>
        </header>
        {pending ? (
          <p className="bg-surface px-4 py-2 text-sm text-muted">Offline, changes pending</p>
        ) : offline ? (
          <p className="bg-surface px-4 py-2 text-sm text-muted">Offline</p>
        ) : null}
        {active ? (
          <Link
            to="/today"
            className="fixed inset-x-0 bottom-16 z-30 flex items-center justify-between border-t border-border bg-surface px-4 py-2 md:static md:bottom-auto md:border-t-0 md:border-b"
          >
            <span className="text-sm">{miniLabels[active.type]}</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatCountdown(remainingSeconds(active, now))}
            </span>
          </Link>
        ) : null}
        {error ? (
          <p role="alert" className="bg-danger-surface px-4 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {signOutError ? (
          <p role="alert" className="bg-danger-surface px-4 py-2 text-sm text-danger">
            {signOutError}
          </p>
        ) : null}
        <main className="flex-1 px-4 py-6">
          <Outlet />
        </main>
        <Modal open={helpOpen} title="Shortcuts" onClose={() => setHelpOpen(false)}>
          <ul className="space-y-2 text-sm">
            <li>`n` new task</li>
            <li>`space` start or stop the timer</li>
            <li>`g` then `t`, `g`, `r`, or `s` for Today, Goals, Reports, Settings</li>
            <li>`?` this list</li>
          </ul>
        </Modal>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 flex border-t border-border bg-surface md:hidden"
      >
        <Navigation layout="tab" />
      </nav>
    </div>
  )
}
