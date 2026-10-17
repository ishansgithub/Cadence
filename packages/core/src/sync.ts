export type SyncTable = 'sessions' | 'tasks'
export type SyncKind = 'insert' | 'update' | 'delete'

export type SyncOp = {
  id: string
  table: SyncTable
  kind: SyncKind
  recordId: string
  payload: Record<string, unknown>
  enqueuedAt: string
}

export type ApplyOutcome = 'applied' | 'duplicate' | 'failed'

export function replayInOrder(ops: SyncOp[], apply: (op: SyncOp) => ApplyOutcome): SyncOp[] {
  const remaining = [...ops]
  while (remaining.length > 0) {
    const outcome = apply(remaining[0])
    if (outcome === 'failed') break
    remaining.shift()
  }
  return remaining
}

type Stamped = { updated_at: string }

export function mergeQueuedUpdate(
  table: SyncTable,
  server: Stamped | null,
  queued: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!server) return queued
  const queuedAt = typeof queued.updated_at === 'string' ? queued.updated_at : ''
  if (server.updated_at <= queuedAt) return queued
  if (table !== 'sessions') return null
  return {
    ended_at: queued.ended_at ?? null,
    interrupted: queued.interrupted ?? false,
    interrupt_reason: queued.interrupt_reason ?? null,
  }
}
