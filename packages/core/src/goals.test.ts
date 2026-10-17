import { describe, expect, it } from 'vitest'
import { countTasksForGoal, formatGoalTarget } from './goals'
import { goalSchema } from './types'
import type { Task } from './types'

describe('formatGoalTarget', () => {
  it('formats hour and deadline targets', () => {
    expect(formatGoalTarget({ target_type: 'hours_per_week', target_value: 10, deadline: null })).toBe('10 h/week')
    expect(formatGoalTarget({ target_type: 'total_hours', target_value: 1.5, deadline: null })).toBe('1.5 h total')
    expect(formatGoalTarget({ target_type: 'deadline', target_value: null, deadline: '2026-03-03' })).toBe('due Mar 3')
    expect(formatGoalTarget({ target_type: 'none', target_value: null, deadline: null })).toBeNull()
  })
})

describe('goalSchema', () => {
  it('accepts a numeric target stored as a string', () => {
    const goal = goalSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      user_id: '22222222-2222-4222-8222-222222222222',
      title: 'Cadence',
      description: null,
      target_type: 'hours_per_week',
      target_value: '10.5',
      deadline: null,
      status: 'active',
      created_at: '2026-03-01T00:00:00.000Z',
      updated_at: '2026-03-01T00:00:00.000Z',
    })
    expect(goal.target_value).toBe(10.5)
  })
})

describe('countTasksForGoal', () => {
  it('counts open and done tasks and skips archived ones', () => {
    const tasks = [
      { goal_id: 'g', status: 'todo' },
      { goal_id: 'g', status: 'done' },
      { goal_id: 'g', status: 'archived' },
      { goal_id: 'other', status: 'todo' },
    ] as Task[]
    expect(countTasksForGoal(tasks, 'g')).toEqual({ open: 1, done: 1 })
  })
})
