import { appName } from '@cadence/core'
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Spinner } from '../../components/Spinner'
import { getSupabase } from '../../lib/supabase'
import { sanitizeReturnPath } from './redirect'
import { useAuth } from './useAuth'

type Mode = 'signin' | 'signup' | 'magic' | 'forgot' | 'check-email' | 'set-password'
type CheckKind = 'magic' | 'signup' | 'reset'
type Notice = { tone: 'error' | 'success'; text: string }

const RESEND_SECONDS = 30
const productLine = 'Plan the day. See where the time goes.'

export function LoginPage() {
  const { user, loading, configError, signIn, signUp, signInWithMagicLink, resetPassword, updatePassword } =
    useAuth()
  const location = useLocation()
  const requested = (location.state as { from?: unknown } | null)?.from

  const [mode, setMode] = useState<Mode>('signin')
  const [checkKind, setCheckKind] = useState<CheckKind>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string }>({})
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(
    configError ? { tone: 'error', text: configError } : null,
  )
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const id = window.setTimeout(() => setResendIn((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [resendIn])

  useEffect(() => {
    let client
    try {
      client = getSupabase()
    } catch {
      return
    }
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('set-password')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return <Spinner label="Checking your session" />
  if (user && mode !== 'set-password') return <Navigate to={sanitizeReturnPath(requested)} replace />

  function clearFeedback() {
    setNotice(null)
    setFieldErrors({})
  }

  function go(next: Mode) {
    clearFeedback()
    setPassword('')
    setConfirmPassword('')
    setMode(next)
  }

  function showCheckEmail(kind: CheckKind) {
    setCheckKind(kind)
    setMode('check-email')
    setResendIn(RESEND_SECONDS)
    setPassword('')
    setConfirmPassword('')
    setFieldErrors({})
    setNotice(null)
  }

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return 'Enter your email.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email.'
    return undefined
  }

  function validatePassword(value: string, { required }: { required: boolean }): string | undefined {
    if (!value) return required ? 'Enter your password.' : undefined
    if (value.length < 6) return 'Password must be at least 6 characters.'
    return undefined
  }

  async function run(task: () => Promise<void>) {
    setPending(true)
    setNotice(null)
    try {
      await task()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Try again.',
      })
    } finally {
      setPending(false)
    }
  }

  function onSignIn(event: FormEvent) {
    event.preventDefault()
    const nextEmail = email.trim()
    const errors = {
      email: validateEmail(nextEmail),
      password: validatePassword(password, { required: true }),
    }
    setFieldErrors(errors)
    if (errors.email || errors.password) return
    void run(() => signIn(nextEmail, password))
  }

  function onSignUp(event: FormEvent) {
    event.preventDefault()
    const nextEmail = email.trim()
    const errors = {
      email: validateEmail(nextEmail),
      password: validatePassword(password, { required: true }),
    }
    setFieldErrors(errors)
    if (errors.email || errors.password) return
    void run(async () => {
      const result = await signUp(nextEmail, password)
      if (result.alreadyRegistered) {
        setNotice({
          tone: 'error',
          text: 'An account with this email already exists. Sign in, or use a magic link.',
        })
        return
      }
      if (result.needsEmailConfirmation) {
        showCheckEmail('signup')
        return
      }
    })
  }

  function onMagicLink(event: FormEvent) {
    event.preventDefault()
    const nextEmail = email.trim()
    const emailError = validateEmail(nextEmail)
    setFieldErrors({ email: emailError })
    if (emailError) return
    void run(async () => {
      await signInWithMagicLink(nextEmail)
      showCheckEmail('magic')
    })
  }

  function onForgot(event: FormEvent) {
    event.preventDefault()
    const nextEmail = email.trim()
    const emailError = validateEmail(nextEmail)
    setFieldErrors({ email: emailError })
    if (emailError) return
    void run(async () => {
      await resetPassword(nextEmail)
      showCheckEmail('reset')
    })
  }

  function onSetPassword(event: FormEvent) {
    event.preventDefault()
    const passwordError = validatePassword(password, { required: true })
    const confirmError =
      password !== confirmPassword ? 'Passwords do not match.' : validatePassword(confirmPassword, { required: true })
    setFieldErrors({ password: passwordError, confirm: confirmError })
    if (passwordError || confirmError) return
    void run(async () => {
      await updatePassword(password)
      setMode('signin')
    })
  }

  function onResend() {
    if (resendIn > 0 || pending) return
    const nextEmail = email.trim()
    const emailError = validateEmail(nextEmail)
    if (emailError) {
      setFieldErrors({ email: emailError })
      return
    }
    void run(async () => {
      if (checkKind === 'magic' || checkKind === 'signup') await signInWithMagicLink(nextEmail)
      else await resetPassword(nextEmail)
      setResendIn(RESEND_SECONDS)
      setNotice({ tone: 'success', text: 'Another email is on its way.' })
    })
  }

  const busy = pending || configError !== null
  const title =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create account'
        : mode === 'magic'
          ? 'Magic link'
          : mode === 'forgot'
            ? 'Forgot password'
            : mode === 'check-email'
              ? 'Check your email'
              : 'Set new password'

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div key={mode} className="cadence-enter w-full max-w-sm rounded-xl border border-border bg-surface p-6">
        <p className="text-lg font-semibold tracking-tight">{appName}</p>
        <p className="mt-1 text-sm text-muted">{productLine}</p>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h1>

        {mode === 'check-email' ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted" role="status">
              {checkKind === 'reset'
                ? 'If an account exists for'
                : 'We sent a link to'}{' '}
              <span className="font-medium text-foreground">{email.trim()}</span>
              {checkKind === 'reset'
                ? '. Follow it to choose a new password.'
                : checkKind === 'signup'
                  ? '. Confirm your account, then sign in.'
                  : '. Open it to sign in.'}
            </p>
            {notice ? <NoticeBanner notice={notice} /> : null}
            <button
              type="button"
              disabled={busy || resendIn > 0}
              onClick={onResend}
              className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-3 text-sm font-medium disabled:opacity-60"
            >
              {pending ? 'Sending…' : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend email'}
            </button>
            <div className="flex flex-col gap-2 text-center text-sm">
              <button type="button" className="min-h-11 text-muted hover:text-foreground" onClick={() => go('signin')}>
                Back to sign in
              </button>
              <button
                type="button"
                className="min-h-11 text-muted hover:text-foreground"
                onClick={() => go(checkKind === 'reset' ? 'forgot' : checkKind === 'signup' ? 'signup' : 'magic')}
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'signin' ? (
          <form className="mt-6 space-y-4" onSubmit={onSignIn} aria-busy={pending}>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              error={fieldErrors.email}
              disabled={busy}
              onChange={setEmail}
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              error={fieldErrors.password}
              disabled={busy}
              onChange={setPassword}
            />
            {notice ? <NoticeBanner notice={notice} /> : null}
            <PrimaryButton disabled={busy}>{pending ? 'Signing in…' : 'Sign in'}</PrimaryButton>
            <div className="space-y-1 text-center text-sm">
              <TextLink disabled={busy} onClick={() => go('forgot')}>
                Forgot password?
              </TextLink>
              <TextLink disabled={busy} onClick={() => go('magic')}>
                Email me a magic link
              </TextLink>
              <TextLink disabled={busy} onClick={() => go('signup')}>
                Create account
              </TextLink>
            </div>
          </form>
        ) : null}

        {mode === 'signup' ? (
          <form className="mt-6 space-y-4" onSubmit={onSignUp} aria-busy={pending}>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              error={fieldErrors.email}
              disabled={busy}
              onChange={setEmail}
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              error={fieldErrors.password}
              disabled={busy}
              onChange={setPassword}
              hint="At least 6 characters"
            />
            {notice ? <NoticeBanner notice={notice} /> : null}
            <PrimaryButton disabled={busy}>{pending ? 'Creating account…' : 'Create account'}</PrimaryButton>
            <div className="text-center">
              <TextLink disabled={busy} onClick={() => go('signin')}>
                Back to sign in
              </TextLink>
            </div>
          </form>
        ) : null}

        {mode === 'magic' ? (
          <form className="mt-6 space-y-4" onSubmit={onMagicLink} aria-busy={pending}>
            <p className="text-sm text-muted">We will email you a one-time link. No password needed.</p>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              error={fieldErrors.email}
              disabled={busy}
              onChange={setEmail}
            />
            {notice ? <NoticeBanner notice={notice} /> : null}
            <PrimaryButton disabled={busy}>{pending ? 'Sending link…' : 'Email me a magic link'}</PrimaryButton>
            <div className="text-center">
              <TextLink disabled={busy} onClick={() => go('signin')}>
                Back to sign in
              </TextLink>
            </div>
          </form>
        ) : null}

        {mode === 'forgot' ? (
          <form className="mt-6 space-y-4" onSubmit={onForgot} aria-busy={pending}>
            <p className="text-sm text-muted">Enter your email and we will send a reset link.</p>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              error={fieldErrors.email}
              disabled={busy}
              onChange={setEmail}
            />
            {notice ? <NoticeBanner notice={notice} /> : null}
            <PrimaryButton disabled={busy}>{pending ? 'Sending link…' : 'Send reset link'}</PrimaryButton>
            <div className="text-center">
              <TextLink disabled={busy} onClick={() => go('signin')}>
                Back to sign in
              </TextLink>
            </div>
          </form>
        ) : null}

        {mode === 'set-password' ? (
          <form className="mt-6 space-y-4" onSubmit={onSetPassword} aria-busy={pending}>
            <p className="text-sm text-muted">Choose a new password for your account.</p>
            <Field
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              error={fieldErrors.password}
              disabled={busy}
              onChange={setPassword}
              hint="At least 6 characters"
            />
            <Field
              id="confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              error={fieldErrors.confirm}
              disabled={busy}
              onChange={setConfirmPassword}
            />
            {notice ? <NoticeBanner notice={notice} /> : null}
            <PrimaryButton disabled={busy}>{pending ? 'Saving…' : 'Save password'}</PrimaryButton>
          </form>
        ) : null}
      </div>
    </main>
  )
}

function Field({
  id,
  label,
  type,
  autoComplete,
  value,
  error,
  disabled,
  onChange,
  hint,
}: {
  id: string
  label: string
  type: string
  autoComplete: string
  value: string
  error?: string
  disabled: boolean
  onChange: (value: string) => void
  hint?: string
}) {
  return (
    <label className="block text-sm font-medium" htmlFor={id}>
      {label}
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 min-h-11 w-full rounded-lg border bg-background px-3 py-2 ${
          error ? 'border-danger' : 'border-border'
        }`}
      />
      {hint && !error ? (
        <span id={`${id}-hint`} className="mt-1 block text-xs font-normal text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="mt-1 block text-xs font-normal text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

function PrimaryButton({ children, disabled }: { children: string; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-foreground disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function TextLink({
  children,
  onClick,
  disabled,
}: {
  children: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block min-h-11 w-full text-sm text-accent disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function NoticeBanner({ notice }: { notice: Notice }) {
  return (
    <p
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={
        notice.tone === 'error'
          ? 'rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger'
          : 'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground'
      }
    >
      {notice.text}
    </p>
  )
}
