import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { Spinner } from '../../components/Spinner';
import { ChunkyButton } from '../../components/ui/ChunkyButton';
import { Icon } from '../../components/ui/Icon';
import { Logo } from '../../components/ui/Logo';
import { Mascot } from '../../components/ui/Mascot';
import { ExtrudedShape, RotatingRing } from '../../components/ui/RotatingRing';
import { getSupabase } from '../../lib/supabase';
import { sanitizeReturnPath } from './redirect';
import { useAuth } from './useAuth';

type Mode =
  'signin' | 'signup' | 'magic' | 'forgot' | 'check-email' | 'set-password';
type CheckKind = 'magic' | 'signup' | 'reset';
type Notice = { tone: 'error' | 'success'; text: string };

const RESEND_SECONDS = 30;
const productLine = 'Plan the day. See where the time goes.';

export function LoginPage() {
  const {
    user,
    loading,
    configError,
    signIn,
    signUp,
    signInWithMagicLink,
    resetPassword,
    updatePassword,
  } = useAuth();
  const location = useLocation();
  const requested = (location.state as { from?: unknown } | null)?.from;

  const [mode, setMode] = useState<Mode>('signin');
  const [checkKind, setCheckKind] = useState<CheckKind>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(
    configError ? { tone: 'error', text: configError } : null,
  );
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  useEffect(() => {
    let client;
    try {
      client = getSupabase();
    } catch {
      return;
    }
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('set-password');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return <Spinner label="Checking your session" />;
  if (user && mode !== 'set-password')
    return <Navigate to={sanitizeReturnPath(requested)} replace />;

  function clearFeedback() {
    setNotice(null);
    setFieldErrors({});
  }

  function go(next: Mode) {
    clearFeedback();
    setPassword('');
    setConfirmPassword('');
    setMode(next);
  }

  function showCheckEmail(kind: CheckKind) {
    setCheckKind(kind);
    setMode('check-email');
    setResendIn(RESEND_SECONDS);
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setNotice(null);
  }

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return 'Enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
      return 'Enter a valid email.';
    return undefined;
  }

  function validatePassword(
    value: string,
    { required }: { required: boolean },
  ): string | undefined {
    if (!value) return required ? 'Enter your password.' : undefined;
    if (value.length < 6) return 'Password must be at least 6 characters.';
    return undefined;
  }

  async function run(task: () => Promise<void>) {
    setPending(true);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice({
        tone: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Try again.',
      });
    } finally {
      setPending(false);
    }
  }

  function onSignIn(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const errors = {
      email: validateEmail(nextEmail),
      password: validatePassword(password, { required: true }),
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    void run(() => signIn(nextEmail, password));
  }

  function onSignUp(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const errors = {
      email: validateEmail(nextEmail),
      password: validatePassword(password, { required: true }),
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    void run(async () => {
      const result = await signUp(nextEmail, password);
      if (result.alreadyRegistered) {
        setNotice({
          tone: 'error',
          text: 'An account with this email already exists. Sign in, or use a magic link.',
        });
        return;
      }
      if (result.needsEmailConfirmation) {
        showCheckEmail('signup');
        return;
      }
    });
  }

  function onMagicLink(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const emailError = validateEmail(nextEmail);
    setFieldErrors({ email: emailError });
    if (emailError) return;
    void run(async () => {
      await signInWithMagicLink(nextEmail);
      showCheckEmail('magic');
    });
  }

  function onForgot(event: FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const emailError = validateEmail(nextEmail);
    setFieldErrors({ email: emailError });
    if (emailError) return;
    void run(async () => {
      await resetPassword(nextEmail);
      showCheckEmail('reset');
    });
  }

  function onSetPassword(event: FormEvent) {
    event.preventDefault();
    const passwordError = validatePassword(password, { required: true });
    const confirmError =
      password !== confirmPassword
        ? 'Passwords do not match.'
        : validatePassword(confirmPassword, { required: true });
    setFieldErrors({ password: passwordError, confirm: confirmError });
    if (passwordError || confirmError) return;
    void run(async () => {
      await updatePassword(password);
      setMode('signin');
    });
  }

  function onResend() {
    if (resendIn > 0 || pending) return;
    const nextEmail = email.trim();
    const emailError = validateEmail(nextEmail);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }
    void run(async () => {
      if (checkKind === 'magic' || checkKind === 'signup')
        await signInWithMagicLink(nextEmail);
      else await resetPassword(nextEmail);
      setResendIn(RESEND_SECONDS);
      setNotice({ tone: 'success', text: 'Another email is on its way.' });
    });
  }

  const busy = pending || configError !== null;
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
              : 'Set new password';

  return (
    <main className="min-h-svh bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      <LoginShowcase />
      <div className="dot-grid flex min-h-svh flex-col px-4 py-5 md:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="rounded-full lg:invisible"
            aria-label="Cadence home"
          >
            <Logo size={30} />
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-foreground/5 hover:text-foreground"
          >
            <Icon name="arrow-left" size={16} strokeWidth={2.4} />
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <motion.div
            className="relative w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <motion.div
              aria-hidden
              className="absolute -top-14 right-5 z-0"
              initial={{ y: 40, rotate: 0 }}
              animate={{ y: 0, rotate: 8 }}
              transition={{
                delay: 0.25,
                type: 'spring',
                stiffness: 200,
                damping: 12,
              }}
            >
              <Mascot name="fox" className="size-24" />
            </motion.div>
            <div className="chunky tone-peach relative z-10 !rounded-[var(--radius-xl)] p-7">
              <p className="text-sm text-muted">{productLine}</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="mt-3 text-3xl">{title}</h1>

                  {mode === 'check-email' ? (
                    <div className="mt-4 space-y-4">
                      <p className="text-sm text-muted" role="status">
                        {checkKind === 'reset'
                          ? 'If an account exists for'
                          : 'We sent a link to'}{' '}
                        <span className="font-medium text-foreground">
                          {email.trim()}
                        </span>
                        {checkKind === 'reset'
                          ? '. Follow it to choose a new password.'
                          : checkKind === 'signup'
                            ? '. Confirm your account, then sign in.'
                            : '. Open it to sign in.'}
                      </p>
                      {notice ? <NoticeBanner notice={notice} /> : null}
                      <ChunkyButton
                        disabled={busy || resendIn > 0}
                        onClick={onResend}
                        className="w-full"
                      >
                        {pending
                          ? 'Sending…'
                          : resendIn > 0
                            ? `Resend in ${resendIn}s`
                            : 'Resend email'}
                      </ChunkyButton>
                      <div className="flex flex-col gap-2 text-center text-sm">
                        <button
                          type="button"
                          className="min-h-11 text-muted hover:text-foreground"
                          onClick={() => go('signin')}
                        >
                          Back to sign in
                        </button>
                        <button
                          type="button"
                          className="min-h-11 text-muted hover:text-foreground"
                          onClick={() =>
                            go(
                              checkKind === 'reset'
                                ? 'forgot'
                                : checkKind === 'signup'
                                  ? 'signup'
                                  : 'magic',
                            )
                          }
                        >
                          Use a different email
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {mode === 'signin' ? (
                    <form
                      className="mt-6 space-y-4"
                      onSubmit={onSignIn}
                      aria-busy={pending}
                    >
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
                      <PrimaryButton disabled={busy}>
                        {pending ? 'Signing in…' : 'Sign in'}
                      </PrimaryButton>
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
                    <form
                      className="mt-6 space-y-4"
                      onSubmit={onSignUp}
                      aria-busy={pending}
                    >
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
                      <PrimaryButton disabled={busy}>
                        {pending ? 'Creating account…' : 'Create account'}
                      </PrimaryButton>
                      <div className="text-center">
                        <TextLink disabled={busy} onClick={() => go('signin')}>
                          Back to sign in
                        </TextLink>
                      </div>
                    </form>
                  ) : null}

                  {mode === 'magic' ? (
                    <form
                      className="mt-6 space-y-4"
                      onSubmit={onMagicLink}
                      aria-busy={pending}
                    >
                      <p className="text-sm text-muted">
                        We will email you a one-time link. No password needed.
                      </p>
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
                      <PrimaryButton disabled={busy}>
                        {pending ? 'Sending link…' : 'Email me a magic link'}
                      </PrimaryButton>
                      <div className="text-center">
                        <TextLink disabled={busy} onClick={() => go('signin')}>
                          Back to sign in
                        </TextLink>
                      </div>
                    </form>
                  ) : null}

                  {mode === 'forgot' ? (
                    <form
                      className="mt-6 space-y-4"
                      onSubmit={onForgot}
                      aria-busy={pending}
                    >
                      <p className="text-sm text-muted">
                        Enter your email and we will send a reset link.
                      </p>
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
                      <PrimaryButton disabled={busy}>
                        {pending ? 'Sending link…' : 'Send reset link'}
                      </PrimaryButton>
                      <div className="text-center">
                        <TextLink disabled={busy} onClick={() => go('signin')}>
                          Back to sign in
                        </TextLink>
                      </div>
                    </form>
                  ) : null}

                  {mode === 'set-password' ? (
                    <form
                      className="mt-6 space-y-4"
                      onSubmit={onSetPassword}
                      aria-busy={pending}
                    >
                      <p className="text-sm text-muted">
                        Choose a new password for your account.
                      </p>
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
                      <PrimaryButton disabled={busy}>
                        {pending ? 'Saving…' : 'Save password'}
                      </PrimaryButton>
                    </form>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function LoginShowcase() {
  return (
    <aside className="tone-peach relative hidden overflow-hidden border-r-2 border-line bg-tone lg:flex lg:flex-col lg:justify-between lg:p-10">
      <Link
        to="/"
        className="relative z-10 w-max rounded-full"
        aria-label="Cadence home"
      >
        <Logo size={34} />
      </Link>
      <div className="relative z-10 max-w-md">
        <h2 className="text-5xl leading-[1.02] font-extrabold xl:text-6xl">
          Plan the day.
          <br />
          See where the{' '}
          <span className="underline decoration-tone-strong decoration-wavy decoration-4 underline-offset-8">
            time goes.
          </span>
        </h2>
        <p className="mt-5 text-lg text-muted">
          Tasks, goals, and a focus timer that keeps its place, even when you
          close the tab.
        </p>
      </div>
      <div className="relative z-10 flex items-end gap-4">
        {(['cat', 'bear', 'rabbit'] as const).map((name, index) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 40, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: [-6, 4, -3][index] }}
            whileHover={{ y: -10, rotate: 0, scale: 1.05 }}
            transition={{
              delay: 0.2 + index * 0.12,
              type: 'spring',
              stiffness: 220,
              damping: 14,
            }}
          >
            <Mascot name={name} className="size-28 xl:size-32" />
          </motion.div>
        ))}
      </div>
      <div className="pointer-events-none absolute -right-28 -bottom-28 opacity-90">
        <RotatingRing text="Start session" separator="✦" size={420} speed={8}>
          <span className="grid size-40 place-items-center rounded-full border-2 border-line bg-surface shadow-[5px_8px_0_0_var(--tone-slab)]">
            <ExtrudedShape shape="play" size={64} />
          </span>
        </RotatingRing>
      </div>
    </aside>
  );
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
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  hint?: string;
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
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
        onChange={(event) => onChange(event.target.value)}
        className={`chunky-input mt-1.5 font-normal ${error ? '!border-danger' : ''}`}
      />
      {hint && !error ? (
        <span
          id={`${id}-hint`}
          className="mt-1 block text-xs font-normal text-muted"
        >
          {hint}
        </span>
      ) : null}
      {error ? (
        <span
          id={`${id}-error`}
          className="mt-1 block text-xs font-normal text-danger"
          role="alert"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: string;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="chunky-btn tone-peach w-full bg-ink !min-h-12 text-ink-foreground"
    >
      {children}
    </button>
  );
}

function TextLink({
  children,
  onClick,
  disabled,
}: {
  children: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block min-h-10 w-full rounded-full text-sm font-semibold text-muted hover:bg-foreground/5 hover:text-foreground disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  return (
    <p
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={
        notice.tone === 'error'
          ? 'cadence-enter rounded-[var(--radius-sm)] bg-danger-surface px-3 py-2 text-sm text-danger'
          : 'cadence-enter rounded-[var(--radius-sm)] border-2 border-tone-slab bg-tone px-3 py-2 text-sm text-foreground'
      }
    >
      {notice.text}
    </p>
  );
}
