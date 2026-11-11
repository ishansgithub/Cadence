import { LayoutGroup, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useSyncStatus } from '../data/use-sync'
import { useAuth } from '../features/auth/useAuth'
import { useSettings } from '../features/settings/useSettings'
import { MiniTimerBar, MiniTimerIndicator } from '../features/timer/MiniTimerBar'
import { useTimer } from '../features/timer/useTimer'
import { AccountMenu } from './AccountMenu'
import { Modal } from './Modal'
import { UpdatePrompt } from './UpdatePrompt'
import { IconButton } from './ui/ChunkyButton'
import { Icon, type IconName } from './ui/Icon'
import { Logo } from './ui/Logo'
import { PageTransition } from './ui/motion'

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/today', label: 'Today', icon: 'today' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/goals', label: 'Goals', icon: 'goals' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function Dock() {
  return (
    <LayoutGroup id="dock">
      <nav
        aria-label="Primary"
        className="chunky pointer-events-auto flex items-center gap-1 !rounded-full p-1.5"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className="group relative flex min-h-11 items-center justify-center rounded-full px-3 sm:px-3.5"
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full bg-foreground/0 transition-colors group-hover:bg-foreground/6" />
                )}
                <span
                  className={`relative flex items-center gap-2 text-sm font-semibold ${
                    isActive ? 'text-ink-foreground' : 'text-foreground'
                  }`}
                >
                  <motion.span
                    className="inline-flex"
                    whileHover={{ rotate: isActive ? 0 : -12, scale: 1.12 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                  >
                    <Icon name={item.icon} size={20} strokeWidth={2.2} />
                  </motion.span>
                  {isActive ? (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="hidden overflow-hidden whitespace-nowrap sm:inline"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </span>
                {!isActive ? (
                  <span className="pointer-events-none absolute -top-10 left-1/2 hidden -translate-x-1/2 translate-y-1 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-ink-foreground opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 md:block">
                    {item.label}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
        <span className="mx-0.5 h-7 w-0.5 rounded-full bg-border" aria-hidden />
        <Link
          to="/focus"
          aria-label="Focus"
          title="Focus"
          className="chunky-btn tone-peach relative !size-11 !min-h-11 !p-0 bg-tone text-foreground"
        >
          <Icon name="play" size={18} strokeWidth={2.4} />
          <MiniTimerIndicator />
        </Link>
      </nav>
    </LayoutGroup>
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
  const location = useLocation()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

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

  function onQuickAdd() {
    const input = document.getElementById('quick-add')
    if (input) {
      input.scrollIntoView({ block: 'center', behavior: 'smooth' })
      input.focus({ preventScroll: true })
      return
    }
    void navigate('/today')
    window.setTimeout(() => document.getElementById('quick-add')?.focus(), 450)
  }

  return (
    <div className="min-h-svh">
      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          scrolled ? 'bg-background/80 shadow-[0_1px_0_0_var(--border)] backdrop-blur-md' : ''
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8 md:py-4">
          <IconButton icon="dots" label="Shortcuts and help" onClick={() => setHelpOpen(true)} />
          <Link to="/" className="rounded-full" aria-label="Cadence home">
            <Logo size={30} />
          </Link>
          <div className="ml-auto flex items-center gap-2.5">
            <IconButton icon="plus" label="New task" variant="primary" onClick={onQuickAdd} />
            <AccountMenu email={user?.email} onSignOut={() => void onSignOut()} />
          </div>
        </div>
      </header>

      <UpdatePrompt />

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {pending || offline ? (
          <p className="cadence-enter tone-butter mt-2 inline-flex items-center gap-2 rounded-full border-2 border-tone-slab bg-tone px-3 py-1 text-sm font-medium text-warning">
            <Icon name="cloud-off" size={16} />
            {pending ? 'Offline, changes pending' : 'Offline'}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-2 rounded-[var(--radius-md)] bg-danger-surface px-4 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {signOutError ? (
          <p role="alert" className="mt-2 rounded-[var(--radius-md)] bg-danger-surface px-4 py-2 text-sm text-danger">
            {signOutError}
          </p>
        ) : null}
      </div>

      <main className={`mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6 ${active ? 'pb-52' : 'pb-36'}`}>
        <PageTransition routeKey={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 px-3 pb-4 md:pb-6">
        <MiniTimerBar />
        <Dock />
      </div>

      <Modal open={helpOpen} title="Shortcuts" onClose={() => setHelpOpen(false)}>
        <ul className="space-y-2.5 text-sm">
          {[
            ['n', 'New task'],
            ['space', 'Start, pause, or resume the timer'],
            ['g then t / g / r / s / f', 'Today, Goals, Reports, Settings, Focus'],
            ['?', 'This list'],
          ].map(([keys, description]) => (
            <li key={keys} className="flex items-center justify-between gap-3">
              <span className="text-muted">{description}</span>
              <kbd className="rounded-lg border-2 border-line bg-background px-2 py-0.5 font-mono text-xs font-semibold shadow-[1px_2px_0_0_var(--sand-slab)]">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
        <Link to="/" className="mt-5 inline-flex text-sm font-semibold underline underline-offset-4">
          About Cadence
        </Link>
      </Modal>
    </div>
  )
}
