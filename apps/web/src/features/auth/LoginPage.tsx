import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { appName } from '@cadence/core'
import { Spinner } from '../../components/Spinner'
import { sanitizeReturnPath } from './redirect'
import { useAuth } from './useAuth'

type Notice = { tone: 'error' | 'success'; text: string }

export function LoginPage() {
  const { user, loading, configError, signIn, signUp, signInWithMagicLink } = useAuth()
  const location = useLocation()
  const requested = (location.state as { from?: unknown } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<'in' | 'up' | 'link' | null>(null)
  const [notice, setNotice] = useState<Notice | null>(
    configError ? { tone: 'error', text: configError } : null,
  )

  if (loading) return <Spinner label="Checking your session" />
  if (user) return <Navigate to={sanitizeReturnPath(requested)} replace />

  async function run(action: 'in' | 'up' | 'link', task: () => Promise<void>) {
    setNotice(null)
    setPending(action)
    try {
      await task()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Try again.',
      })
    } finally {
      setPending(null)
    }
  }

  function onSignIn(event: FormEvent) {
    event.preventDefault()
    const nextEmail = email.trim()
    if (!nextEmail || !password) {
      setNotice({ tone: 'error', text: 'Enter your email and password.' })
      return
    }
    void run('in', () => signIn(nextEmail, password))
  }

  function onSignUp() {
    const nextEmail = email.trim()
    if (!nextEmail || password.length < 6) {
      setNotice({ tone: 'error', text: 'Use an email and a password of at least 6 characters.' })
      return
    }
    void run('up', async () => {
      const result = await signUp(nextEmail, password)
      if (result.alreadyRegistered) {
        setNotice({
          tone: 'error',
          text: 'An account with this email already exists. Sign in, or email yourself a link.',
        })
        return
      }
      if (result.needsEmailConfirmation) {
        setNotice({
          tone: 'success',
          text: 'Check your email to confirm your account, then sign in.',
        })
      }
    })
  }

  function onMagicLink() {
    const nextEmail = email.trim()
    if (!nextEmail) {
      setNotice({ tone: 'error', text: 'Enter the email that should receive the link.' })
      return
    }
    void run('link', async () => {
      await signInWithMagicLink(nextEmail)
      setNotice({ tone: 'success', text: 'Check your email for a sign-in link.' })
    })
  }

  const busy = pending !== null || configError !== null

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <p className="font-serif text-sm tracking-wide text-accent">{appName}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Use a password, or get a one-time link by email.</p>

        <form className="mt-6 space-y-4" onSubmit={onSignIn}>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          {notice ? (
            <p
              role={notice.tone === 'error' ? 'alert' : 'status'}
              className={
                notice.tone === 'error'
                  ? 'rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger'
                  : 'rounded-lg bg-background px-3 py-2 text-sm text-foreground'
              }
            >
              {notice.text}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent px-3 py-2 font-medium text-accent-foreground disabled:opacity-60"
          >
            {pending === 'in' ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onSignUp}
            className="w-full rounded-lg border border-border px-3 py-2 font-medium disabled:opacity-60"
          >
            {pending === 'up' ? 'Creating account…' : 'Create account'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onMagicLink}
            className="w-full rounded-lg px-3 py-2 text-sm text-accent disabled:opacity-60"
          >
            {pending === 'link' ? 'Sending link…' : 'Email me a sign-in link'}
          </button>
        </form>
      </div>
    </main>
  )
}
