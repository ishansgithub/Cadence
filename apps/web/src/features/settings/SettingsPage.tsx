import { backupCounts, backupSchema, resolveTimeZone, type Backup, type SettingsUpdate } from '@cadence/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { useToast } from '../../components/useToast'
import { exportBackup, importBackup } from '../../data/backup-repo'
import { errorMessage } from '../../data/errors'
import { getSupabase } from '../../lib/supabase'
import { Spinner } from '../../components/Spinner'
import { ThemeToggle } from './ThemeToggle'
import { useSettings } from './useSettings'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function SettingsPage() {
  const { settings, loading, error, save } = useSettings()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<Backup | null>(null)
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  if (loading) return <Spinner label="Loading settings" fullScreen={false} />
  if (error || !settings) {
    return (
      <section className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-3 text-sm text-danger">{error ?? 'Settings are unavailable.'}</p>
      </section>
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input: SettingsUpdate = {
      focus_min: Number(form.get('focus_min')),
      short_break_min: Number(form.get('short_break_min')),
      long_break_min: Number(form.get('long_break_min')),
      sessions_before_long_break: Number(form.get('sessions_before_long_break')),
      week_starts_on: Number(form.get('week_starts_on')),
      timezone: String(form.get('timezone') || resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)),
      sound_enabled: form.get('sound_enabled') === 'on',
      notifications_enabled: form.get('notifications_enabled') === 'on',
    }
    setPending(true)
    try {
      await save(input)
      setNotice('Settings saved.')
    } catch (caught) {
      toast.showError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  async function onExport() {
    try {
      const backup = await exportBackup(getSupabase())
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cadence-${backup.exported_at.slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (caught) {
      toast.showError(errorMessage(caught))
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      const parsed = backupSchema.parse(JSON.parse(await file.text()))
      setPreview(parsed)
    } catch (caught) {
      toast.showError(errorMessage(caught))
    }
  }

  const counts = preview ? backupCounts(preview) : null

  return (
    <section className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Timer, week, and this device's theme.</p>
      </div>
      <ThemeToggle />
      <form onSubmit={onSubmit} className="space-y-4">
        <NumberField name="focus_min" label="Focus minutes" defaultValue={settings.focus_min} />
        <NumberField name="short_break_min" label="Short break minutes" defaultValue={settings.short_break_min} />
        <NumberField name="long_break_min" label="Long break minutes" defaultValue={settings.long_break_min} />
        <NumberField
          name="sessions_before_long_break"
          label="Focus sessions before a long break"
          defaultValue={settings.sessions_before_long_break}
        />
        <label className="block text-sm font-medium">
          Week starts on
          <select
            name="week_starts_on"
            defaultValue={settings.week_starts_on}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3"
          >
            {weekdays.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Time zone
          <input
            name="timezone"
            defaultValue={settings.timezone}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="sound_enabled" defaultChecked={settings.sound_enabled} />
          Sound when a session ends
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="notifications_enabled" defaultChecked={settings.notifications_enabled} />
          Notifications when a session ends
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-accent px-4 font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {notice ? <p className="text-sm text-muted">{notice}</p> : null}
      </form>
      <div className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Backup</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void onExport()} className="min-h-11 rounded-lg border border-border px-4 text-sm">
            Download JSON
          </button>
          <label className="min-h-11 rounded-lg border border-border px-4 py-3 text-sm">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <ConfirmDialog
        open={preview !== null}
        title="Import backup"
        body={
          counts
            ? `This will upsert ${counts.goals} goals, ${counts.tasks} tasks, ${counts.sessions} sessions, and ${counts.blocklists} blocklists.`
            : ''
        }
        confirmLabel={importing ? 'Importing…' : 'Import'}
        onClose={() => setPreview(null)}
        onConfirm={() => {
          if (!preview) return
          setImporting(true)
          void importBackup(getSupabase(), preview)
            .then(() => {
              setNotice('Import finished.')
              setPreview(null)
              return queryClient.invalidateQueries()
            })
            .catch((caught: unknown) => toast.showError(errorMessage(caught)))
            .finally(() => setImporting(false))
        }}
      />
    </section>
  )
}

function NumberField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        name={name}
        type="number"
        min={1}
        required
        defaultValue={defaultValue}
        className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3"
      />
    </label>
  )
}
