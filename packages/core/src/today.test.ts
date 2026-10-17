import { describe, expect, it } from 'vitest'
import type { Task } from './types'
import { partitionToday } from './today'

const today = '2026-03-04'
const zone = 'UTC'

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    user_id: '11111111-1111-4111-8111-111111111111',
    goal_id: null,
    notes: null,
    estimate_min: null,
    due_date: null,
    planned_for: null,
    status: 'todo',
    completed_at: null,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('partitionToday', () => {
  const tasks = [
    task({ id: 'p2', title: 'Later', planned_for: today, estimate_min: 25, created_at: '2026-03-02T00:00:00.000Z' }),
    task({ id: 'p1', title: 'First', planned_for: today, estimate_min: 10, created_at: '2026-03-01T00:00:00.000Z' }),
    task({ id: 'done', title: 'Finished', planned_for: today, status: 'done', completed_at: '2026-03-04T01:00:00.000Z' }),
    task({ id: 'late', title: 'Late', due_date: '2026-03-01' }),
    task({ id: 'planned-late', title: 'Planned late', due_date: '2026-03-01', planned_for: today }),
    task({ id: 'soon', title: 'Soon', due_date: '2026-03-05' }),
    task({ id: 'done-elsewhere', title: 'Logged', status: 'done', completed_at: '2026-03-04T15:00:00.000Z' }),
    task({ id: 'old-done', title: 'Yesterday', status: 'done', completed_at: '2026-03-03T15:00:00.000Z' }),
  ]

  it('groups planned, overdue, suggested, and done tasks', () => {
    const groups = partitionToday(tasks, today, zone)
    expect(groups.planned.map((item) => item.id)).toEqual(['p1', 'planned-late', 'p2'])
    expect(groups.plannedEstimateMin).toBe(35)
    expect(groups.overdue.map((item) => item.id)).toEqual(['late'])
    expect(groups.suggested.map((item) => item.id)).toEqual(['soon'])
    expect(groups.doneToday.map((item) => item.id)).toEqual(['done', 'done-elsewhere'])
  })
})
