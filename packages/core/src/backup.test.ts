import { describe, expect, it } from 'vitest'
import { assignBackupUser, backupCounts, backupSchema } from './backup'

const user = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'

const backup = backupSchema.parse({
  version: 1,
  exported_at: '2026-03-04T00:00:00.000Z',
  goals: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      user_id: other,
      title: 'Ship',
      description: null,
      target_type: 'none',
      target_value: null,
      deadline: null,
      status: 'active',
      created_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T00:00:00.000Z',
    },
  ],
  tasks: [],
  sessions: [],
  blocklists: [],
  settings: {
    user_id: other,
    focus_min: 25,
    short_break_min: 5,
    long_break_min: 15,
    sessions_before_long_break: 4,
    week_starts_on: 1,
    timezone: 'UTC',
    sound_enabled: true,
    notifications_enabled: true,
    updated_at: '2026-03-01T00:00:00.000Z',
  },
})

describe('backup', () => {
  it('counts rows and rewrites the owner', () => {
    expect(backupCounts(backup).goals).toBe(1)
    const owned = assignBackupUser(backup, user)
    expect(owned.goals[0]?.user_id).toBe(user)
    expect(owned.settings.user_id).toBe(user)
    expect(owned.goals[0]?.id).toBe(backup.goals[0]?.id)
  })
})
