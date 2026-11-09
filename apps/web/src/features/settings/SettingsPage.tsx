import {
  backupCounts,
  backupSchema,
  resolveTimeZone,
  type Backup,
  type Blocklist,
  type SettingsUpdate,
} from '@cadence/core'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { Spinner } from '../../components/Spinner'
import { useToast } from '../../components/useToast'
import { exportBackup, importBackup } from '../../data/backup-repo'
import { deleteCadenceData } from '../../data/delete-account'
import { errorMessage } from '../../data/errors'
import { getSupabase } from '../../lib/supabase'
import {
  useBlocklists,
  useCreateBlocklist,
  useDeleteBlocklist,
  useUpdateBlocklist,
} from '../../data/use-blocklists'
import { ThemeToggle } from './ThemeToggle'
import { useSettings } from './useSettings'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type SectionId = 'timer' | 'general' | 'notifications' | 'appearance' | 'blocklists' | 'data'

const sections: Array<{ id: SectionId; label: string; blurb: string }> = [
  { id: 'timer', label: 'Timer', blurb: 'Focus and break lengths' },
  { id: 'general', label: 'General', blurb: 'Week start and time zone' },
  { id: 'notifications', label: 'Notifications and sound', blurb: 'Session-end alerts' },
  { id: 'appearance', label: 'Appearance', blurb: 'Light, dark, or system' },
  { id: 'blocklists', label: 'Blocklists', blurb: 'Domains to block while focusing' },
  { id: 'data', label: 'Data', blurb: 'Export, import, delete account' },
]

export function SettingsPage() {
  const { settings, loading, error } = useSettings()
  const [section, setSection] = useState<SectionId | null>(null)
  const [desktopSection, setDesktopSection] = useState<SectionId>('timer')

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => {
      if (media.matches) setSection(null)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (loading) return <Spinner label="Loading settings" fullScreen={false} />
  if (error || !settings) {
    return (
      <section className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-3 text-sm text-danger">{error ?? 'Settings are unavailable.'}</p>
      </section>
    )
  }

  const active = section ?? desktopSection

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted">Timer, preferences, and your data.</p>

      {/* Mobile: list or detail */}
      <div className="mt-6 md:hidden">
        {section === null ? (
          <ul className="cadence-enter divide-y divide-border rounded-xl border border-border bg-surface">
            {sections.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSection(item.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    <span className="block text-sm text-muted">{item.blurb}</span>
                  </span>
                  <span className="text-muted" aria-hidden>
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div key={section} className="cadence-enter">
            <button
              type="button"
              onClick={() => setSection(null)}
              className="min-h-11 text-sm font-medium text-accent"
            >
              Back to settings
            </button>
            <div className="mt-4">
              <SectionBody id={section} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop: two-pane */}
      <div className="mt-6 hidden gap-6 md:grid md:grid-cols-[14rem_1fr]">
        <nav aria-label="Settings sections" className="space-y-1">
          {sections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDesktopSection(item.id)}
              className={`block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                active === item.id ? 'bg-accent-muted text-accent' : 'text-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div key={active} className="cadence-enter rounded-xl border border-border bg-surface p-5">
          <SectionBody id={active} />
        </div>
      </div>
    </section>
  )
}

function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case 'timer':
      return <TimerSection />
    case 'general':
      return <GeneralSection />
    case 'notifications':
      return <NotificationsSection />
    case 'appearance':
      return <AppearanceSection />
    case 'blocklists':
      return <BlocklistsSection />
    case 'data':
      return <DataSection />
  }
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
}

function TimerSection() {
  const { settings, save } = useSettings()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  if (!settings) return null

  const current = settings

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      await save({
        ...settingsPatch(current),
        focus_min: Number(form.get('focus_min')),
        short_break_min: Number(form.get('short_break_min')),
        long_break_min: Number(form.get('long_break_min')),
        sessions_before_long_break: Number(form.get('sessions_before_long_break')),
      })
      setNotice('Timer settings saved.')
    } catch (caught) {
      toast.showError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <SectionTitle>Timer</SectionTitle>
      <NumberField name="focus_min" label="Focus minutes" defaultValue={current.focus_min} />
      <NumberField name="short_break_min" label="Short break minutes" defaultValue={current.short_break_min} />
      <NumberField name="long_break_min" label="Long break minutes" defaultValue={current.long_break_min} />
      <NumberField
        name="sessions_before_long_break"
        label="Sessions before long break"
        defaultValue={current.sessions_before_long_break}
      />
      <SaveButton pending={pending} notice={notice} />
    </form>
  )
}

function GeneralSection() {
  const { settings, save } = useSettings()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  if (!settings) return null
  const current = settings

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      await save({
        ...settingsPatch(current),
        week_starts_on: Number(form.get('week_starts_on')),
        timezone: String(form.get('timezone') || resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)),
      })
      setNotice('General settings saved.')
    } catch (caught) {
      toast.showError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <SectionTitle>General</SectionTitle>
      <label className="block text-sm font-medium">
        Week starts on
        <select
          name="week_starts_on"
          defaultValue={current.week_starts_on}
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
          defaultValue={current.timezone}
          className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3"
        />
      </label>
      <SaveButton pending={pending} notice={notice} />
    </form>
  )
}

function NotificationsSection() {
  const { settings, save } = useSettings()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  if (!settings) return null
  const current = settings

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      await save({
        ...settingsPatch(current),
        sound_enabled: form.get('sound_enabled') === 'on',
        notifications_enabled: form.get('notifications_enabled') === 'on',
      })
      setNotice('Notification settings saved.')
    } catch (caught) {
      toast.showError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <SectionTitle>Notifications and sound</SectionTitle>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="sound_enabled" defaultChecked={current.sound_enabled} />
        Sound when a session ends
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="notifications_enabled" defaultChecked={current.notifications_enabled} />
        Notifications when a session ends
      </label>
      <SaveButton pending={pending} notice={notice} />
    </form>
  )
}

function AppearanceSection() {
  return (
    <div className="space-y-4">
      <SectionTitle>Appearance</SectionTitle>
      <p className="text-sm text-muted">Applies on this device immediately.</p>
      <ThemeToggle />
    </div>
  )
}

function BlocklistsSection() {
  const lists = useBlocklists()
  const create = useCreateBlocklist()
  const update = useUpdateBlocklist()
  const remove = useDeleteBlocklist()
  const [editing, setEditing] = useState<Blocklist | null>(null)
  const [name, setName] = useState('')
  const [domains, setDomains] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  function startCreate() {
    setEditing(null)
    setName('')
    setDomains('')
    setIsDefault(false)
  }

  function startEdit(list: Blocklist) {
    setEditing(list)
    setName(list.name)
    setDomains(list.domains.join(', '))
    setIsDefault(list.is_default)
  }

  function save() {
    const input = {
      name: name.trim(),
      domains: domains
        .split(/[\s,]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
      is_default: isDefault,
    }
    if (!input.name) return
    if (editing) {
      update.mutate({ id: editing.id, input }, { onSuccess: startCreate })
    } else {
      create.mutate(input, { onSuccess: startCreate })
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle>Blocklists</SectionTitle>
      <p className="text-sm text-muted">
        Named domain lists for site blocking during focus (used by the browser extension later).
      </p>
      {lists.isPending ? <p className="text-sm text-muted">Loading blocklists…</p> : null}
      {lists.isError ? (
        <p className="text-sm text-danger" role="alert">
          {lists.error instanceof Error ? lists.error.message : 'Could not load blocklists.'}
        </p>
      ) : null}
      {(lists.data ?? []).length === 0 && !lists.isPending ? (
        <EmptyState title="No blocklists" body="Create one to prepare domains for focus sessions." />
      ) : (
        <ul className="space-y-2">
          {(lists.data ?? []).map((list) => (
            <li key={list.id} className="rounded-xl border border-border px-3 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {list.name}
                    {list.is_default ? <span className="ml-2 text-xs text-muted">Default</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {list.domains.length === 0 ? 'No domains' : list.domains.join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(list)}
                    className="min-h-11 rounded-lg border border-border px-3 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate(list.id)}
                    className="min-h-11 rounded-lg border border-border px-3 text-sm text-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-medium">{editing ? 'Edit blocklist' : 'New blocklist'}</p>
        <label className="block text-sm font-medium">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Domains
          <input
            value={domains}
            onChange={(event) => setDomains(event.target.value)}
            placeholder="reddit.com, youtube.com"
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
          Default list
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={create.isPending || update.isPending}
            className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {editing ? 'Save list' : 'Add list'}
          </button>
          {editing ? (
            <button type="button" onClick={startCreate} className="min-h-11 rounded-lg border border-border px-4 text-sm">
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function DataSection() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState<Backup | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const counts = preview ? backupCounts(preview) : null

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
    setImportError(null)
    setPreview(null)
    try {
      const parsed = backupSchema.parse(JSON.parse(await file.text()))
      setPreview(parsed)
    } catch (caught) {
      setImportError(errorMessage(caught))
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Data</SectionTitle>
      <div className="space-y-3">
        <p className="text-sm font-medium">Export</p>
        <button type="button" onClick={() => void onExport()} className="min-h-11 rounded-lg border border-border px-4 text-sm">
          Download JSON
        </button>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Import</p>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-border px-4 text-sm">
          Choose JSON file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
        {importError ? (
          <p className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger" role="alert">
            {importError}
          </p>
        ) : null}
        {preview && counts ? (
          <div className="rounded-xl border border-border bg-background px-3 py-3 text-sm">
            <p className="font-medium">Preview</p>
            <p className="mt-1 text-muted">
              {counts.goals} goals · {counts.tasks} tasks · {counts.sessions} sessions · {counts.blocklists}{' '}
              blocklists
            </p>
            <p className="mt-1 text-muted">Exported {preview.exported_at}</p>
          </div>
        ) : null}
      </div>
      {notice ? <p className="text-sm text-muted">{notice}</p> : null}
      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-sm font-medium text-danger">Delete account data</p>
        <p className="text-sm text-muted">
          Removes your Cadence goals, tasks, sessions, blocklists, and settings, then signs you out.
        </p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="min-h-11 rounded-lg border border-danger/40 bg-danger-surface px-4 text-sm font-medium text-danger"
        >
          Delete my data
        </button>
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
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Cadence data"
        body="This cannot be undone. Your login may still exist until the account is removed on the server."
        confirmLabel={deleting ? 'Deleting…' : 'Delete everything'}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleting(true)
          void deleteCadenceData(getSupabase())
            .catch((caught: unknown) => toast.showError(errorMessage(caught)))
            .finally(() => setDeleting(false))
        }}
      />
    </div>
  )
}

function settingsPatch(settings: NonNullable<ReturnType<typeof useSettings>['settings']>): SettingsUpdate {
  return {
    focus_min: settings.focus_min,
    short_break_min: settings.short_break_min,
    long_break_min: settings.long_break_min,
    sessions_before_long_break: settings.sessions_before_long_break,
    week_starts_on: settings.week_starts_on,
    timezone: settings.timezone,
    sound_enabled: settings.sound_enabled,
    notifications_enabled: settings.notifications_enabled,
  }
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
        className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 tabular-nums"
      />
    </label>
  )
}

function SaveButton({ pending, notice }: { pending: boolean; notice: string | null }) {
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      {notice ? <p className="text-sm text-muted">{notice}</p> : null}
    </>
  )
}
