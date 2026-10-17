import { Spinner } from '../../components/Spinner'
import { useSettings } from './useSettings'

export function SettingsPage() {
  const { settings, loading, error } = useSettings()

  if (loading) return <Spinner label="Loading settings" fullScreen={false} />
  if (error || !settings) {
    return (
      <section className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-3 text-muted">Timer preferences will be editable here later.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-3 text-muted">A settings row is saved for this account. Editing comes later.</p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-muted">Time zone</dt>
          <dd>{settings.timezone}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-muted">Focus</dt>
          <dd>{settings.focus_min} min</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-muted">Short break</dt>
          <dd>{settings.short_break_min} min</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-muted">Long break</dt>
          <dd>{settings.long_break_min} min</dd>
        </div>
      </dl>
    </section>
  )
}
