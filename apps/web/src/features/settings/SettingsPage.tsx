import {
  backupCounts,
  backupSchema,
  resolveTimeZone,
  type Backup,
  type Blocklist,
  type SettingsUpdate,
} from '@cadence/core'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { Spinner } from '../../components/Spinner'
import { ChunkyButton } from '../../components/ui/ChunkyButton'
import { Icon } from '../../components/ui/Icon'
import { useToast } from '../../components/useToast'
import type { Tone } from '../../lib/palette'
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

const sections: Array<{ id: SectionId; label: string; blurb: string; emoji: string; tone: Tone }> = [
  { id: 'timer', label: 'Timer', blurb: 'Focus and break lengths', emoji: '⏱️', tone: 'peach' },
  { id: 'general', label: 'General', blurb: 'Week start and time zone', emoji: '🗓️', tone: 'sky' },
  { id: 'notifications', label: 'Notifications and sound', blurb: 'Session-end alerts', emoji: '🔔', tone: 'butter' },
  { id: 'appearance', label: 'Appearance', blurb: 'Light, dark, or system', emoji: '🎨', tone: 'lilac' },
  { id: 'blocklists', label: 'Blocklists', blurb: 'Domains to block while focusing', emoji: '🚧', tone: 'rose' },
  { id: 'data', label: 'Data', blurb: 'Export, import, delete account', emoji: '📦', tone: 'sage' },
]

function SectionEmoji({ emoji, tone }: { emoji: string; tone: Tone }) {
  return (
    <span
      aria-hidden
      className={`tone-${tone} grid size-10 shrink-0 place-items-center rounded-full border-2 border-line bg-tone text-lg`}
    >
      {emoji}
    </span>
  )
}

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
        <h1 className="text-4xl md:text-5xl">Settings</h1>
        <p className="mt-3 text-sm text-danger">{error ?? 'Settings are unavailable.'}</p>
      </section>
    )
  }

  const active = section ?? desktopSection

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-4xl md:text-5xl">Settings</h1>
      <p className="mt-1 text-muted">Timer, preferences, and your data.</p>

      {/* Mobile: list or detail */}
      <div className="mt-6 md:hidden">
        {section === null ? (
          <ul className="cadence-enter space-y-2.5">
            {sections.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`tone-${item.tone} chunky chunky-hover flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left`}
                >
                  <SectionEmoji emoji={item.emoji} tone={item.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-sm text-muted">{item.blurb}</span>
                  </span>
                  <Icon name="arrow-right" size={18} strokeWidth={2.4} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div key={section} className="cadence-enter">
            <ChunkyButton size="sm" icon="arrow-left" onClick={() => setSection(null)}>
              Back to settings
            </ChunkyButton>
            <div className="chunky mt-4 p-5">
              <SectionBody id={section} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop: two-pane */}
      <div className="mt-8 hidden gap-8 md:grid md:grid-cols-[17rem_1fr]">
        <LayoutGroup id="settings-nav">
          <nav aria-label="Settings sections" className="space-y-1.5">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={active === item.id ? 'page' : undefined}
                onClick={() => setDesktopSection(item.id)}
                className={`group relative flex min-h-13 w-full items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 text-left text-sm font-semibold active:!scale-100 ${
                  active === item.id ? 'text-ink-foreground' : 'text-foreground hover:bg-foreground/5'
                }`}
              >
                {active === item.id ? (
                  <motion.span
                    layoutId="settings-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  />
                ) : null}
                <span className="relative transition-transform duration-300 ease-[var(--ease-spring)] group-hover:-rotate-6 group-hover:scale-110">
                  <SectionEmoji emoji={item.emoji} tone={item.tone} />
                </span>
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </nav>
        </LayoutGroup>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className={`chunky tone-${sections.find((item) => item.id === active)?.tone ?? 'peach'} p-6`}
            >
              <SectionBody id={active} />
            </motion.div>
          </AnimatePresence>
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
  return <h2 className="text-2xl font-bold">{children}</h2>
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
      <div className="grid gap-4 sm:grid-cols-2">
      <NumberField name="focus_min" label="Focus minutes" defaultValue={current.focus_min} />
      <NumberField name="short_break_min" label="Short break minutes" defaultValue={current.short_break_min} />
      <NumberField name="long_break_min" label="Long break minutes" defaultValue={current.long_break_min} />
      <NumberField
        name="sessions_before_long_break"
        label="Sessions before long break"
        defaultValue={current.sessions_before_long_break}
      />
      </div>
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
          className="mt-1.5 w-full font-normal"
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
          className="chunky-input mt-1.5 font-normal"
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
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="sound_enabled" defaultChecked={current.sound_enabled} />
        Sound when a session ends
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
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
        <EmptyState mascot="bear" title="No blocklists" body="Create one to prepare domains for focus sessions." />
      ) : (
        <ul className="space-y-2">
          {(lists.data ?? []).map((list) => (
            <li key={list.id} className="chunky-soft chunky-hover px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {list.name}
                    {list.is_default ? (
                      <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-ink-foreground">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {list.domains.length === 0 ? 'No domains' : list.domains.join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ChunkyButton size="sm" onClick={() => startEdit(list)}>
                    Edit
                  </ChunkyButton>
                  <ChunkyButton size="sm" variant="danger" onClick={() => remove.mutate(list.id)}>
                    Delete
                  </ChunkyButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-3 rounded-[var(--radius-lg)] border-2 border-dashed border-border p-4">
        <p className="font-display text-lg font-bold">{editing ? 'Edit blocklist' : 'New blocklist'}</p>
        <label className="block text-sm font-medium">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="chunky-input mt-1.5 font-normal"
          />
        </label>
        <label className="block text-sm font-medium">
          Domains
          <input
            value={domains}
            onChange={(event) => setDomains(event.target.value)}
            placeholder="reddit.com, youtube.com"
            className="chunky-input mt-1.5 font-normal"
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} />
          Default list
        </label>
        <div className="flex flex-wrap gap-2">
          <ChunkyButton
            variant="primary"
            icon={editing ? 'check' : 'plus'}
            onClick={save}
            loading={create.isPending || update.isPending}
          >
            {editing ? 'Save list' : 'Add list'}
          </ChunkyButton>
          {editing ? <ChunkyButton onClick={startCreate}>Cancel</ChunkyButton> : null}
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
        <p className="text-sm font-semibold">Export</p>
        <ChunkyButton icon="arrow-right" onClick={() => void onExport()}>
          Download JSON
        </ChunkyButton>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold">Import</p>
        <label className="chunky-btn cursor-pointer bg-surface focus-within:outline-2 focus-within:outline-line">
          Choose JSON file
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
        {importError ? (
          <p className="rounded-[var(--radius-sm)] bg-danger-surface px-3 py-2 text-sm text-danger" role="alert">
            {importError}
          </p>
        ) : null}
        {preview && counts ? (
          <div className="chunky-soft px-4 py-3 text-sm">
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
      <div className="space-y-3 rounded-[var(--radius-lg)] border-2 border-dashed border-danger/40 p-4">
        <p className="text-sm font-semibold text-danger">Delete account data</p>
        <p className="text-sm text-muted">
          Removes your Cadence goals, tasks, sessions, blocklists, and settings, then signs you out.
        </p>
        <ChunkyButton variant="danger" icon="trash" onClick={() => setDeleteOpen(true)}>
          Delete my data
        </ChunkyButton>
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
        className="chunky-input mt-1.5 font-normal tabular-nums"
      />
    </label>
  )
}

function SaveButton({ pending, notice }: { pending: boolean; notice: string | null }) {
  return (
    <>
      <ChunkyButton type="submit" variant="primary" icon="check" loading={pending}>
        {pending ? 'Saving…' : 'Save'}
      </ChunkyButton>
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-done"
            role="status"
          >
            ✓ {notice}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </>
  )
}
