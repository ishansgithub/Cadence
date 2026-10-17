import { describe, expect, it } from 'vitest'
import { matchGoal, parseQuickAdd } from './quick-add'

describe('parseQuickAdd', () => {
  it('reads a goal, an estimate, and a relative due date', () => {
    expect(parseQuickAdd('Write spec #cadence ~1h30m !tomorrow', '2026-03-01')).toEqual({
      title: 'Write spec',
      goalQuery: 'cadence',
      estimateMin: 90,
      dueDate: '2026-03-02',
    })
  })

  it('reads minute estimates and an explicit date', () => {
    expect(parseQuickAdd('Ship ~30m !2026-04-01', '2026-03-01')).toEqual({
      title: 'Ship',
      goalQuery: null,
      estimateMin: 30,
      dueDate: '2026-04-01',
    })
  })

  it('keeps a plain title', () => {
    expect(parseQuickAdd('Just a title', '2026-03-01')).toEqual({
      title: 'Just a title',
      goalQuery: null,
      estimateMin: null,
      dueDate: null,
    })
  })
})

describe('matchGoal', () => {
  const goals = [
    { id: '1', title: 'Cadence' },
    { id: '2', title: 'Career' },
  ]

  it('matches a unique prefix', () => {
    expect(matchGoal(goals, 'cad')).toEqual(goals[0])
  })

  it('refuses an ambiguous prefix', () => {
    expect(matchGoal(goals, 'ca')).toBe('ambiguous')
  })

  it('reports no match', () => {
    expect(matchGoal(goals, 'house')).toBe('none')
  })
})
