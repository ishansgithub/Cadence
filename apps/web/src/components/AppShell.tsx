import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { appName } from '@cadence/core'
import { useAuth } from '../features/auth/useAuth'
import { SettingsProvider } from '../features/settings/SettingsProvider'
import { useSettings } from '../features/settings/useSettings'

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
      ? 'block rounded-lg px-3 py-2 text-sm font-medium'
      : 'flex flex-1 flex-col items-center px-1 py-2 text-xs font-medium'
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
      <ShellFrame />
    </SettingsProvider>
  )
}

function ShellFrame() {
  const { user, signOut } = useAuth()
  const { error } = useSettings()
  const [signOutError, setSignOutError] = useState<string | null>(null)

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

      <div className="flex min-h-svh flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="font-serif text-lg md:hidden">{appName}</p>
          <p className="ml-auto truncate text-sm text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm"
          >
            Sign out
          </button>
        </header>
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
