import { describe, expect, it, vi } from 'vitest'
import { mergeQueuedUpdate, replayInOrder, type SyncOp } from './sync'

function op(id: string, recordId = id): SyncOp {
  return {
    id,
    table: 'tasks',
    kind: 'insert',
    recordId,
    payload: { id: recordId },
    enqueuedAt: '2026-03-04T00:00:00.000Z',
  }
}

describe('write queue', () => {
  it('replays in order and stops at the first failure', () => {
    const seen: string[] = []
    const remaining = replayInOrder([op('a'), op('b'), op('c')], (item) => {
      seen.push(item.id)
      return item.id === 'b' ? 'failed' : 'applied'
    })
    expect(seen).toEqual(['a', 'b'])
    expect(remaining.map((item) => item.id)).toEqual(['b', 'c'])
  })

  it('treats a repeated insert id as a successful no-op', () => {
    const applied = new Set<string>()
    const apply = (item: SyncOp) => {
      if (applied.has(item.recordId)) return 'duplicate' as const
      applied.add(item.recordId)
      return 'applied' as const
    }
    expect(replayInOrder([op('1', 'row'), op('2', 'row')], apply)).toEqual([])
    expect(applied.size).toBe(1)
  })

  it('keeps a newer server task and still applies a queued session ending', () => {
    expect(
      mergeQueuedUpdate('tasks', { updated_at: '2026-03-05T00:00:00.000Z' }, {
        title: 'Local',
        updated_at: '2026-03-04T00:00:00.000Z',
      }),
    ).toBeNull()
    expect(
      mergeQueuedUpdate('sessions', { updated_at: '2026-03-05T00:00:00.000Z' }, {
        ended_at: '2026-03-04T00:25:00.000Z',
        interrupted: true,
        interrupt_reason: 'Distracted',
        updated_at: '2026-03-04T00:00:00.000Z',
      }),
    ).toEqual({
      ended_at: '2026-03-04T00:25:00.000Z',
      interrupted: true,
      interrupt_reason: 'Distracted',
    })
  })
})

describe('replay does not call later ops after a failure', () => {
  it('leaves the failed op at the head', () => {
    const apply = vi.fn(() => 'failed' as const)
    const remaining = replayInOrder([op('a'), op('b')], apply)
    expect(apply).toHaveBeenCalledOnce()
    expect(remaining[0]?.id).toBe('a')
  })
})
