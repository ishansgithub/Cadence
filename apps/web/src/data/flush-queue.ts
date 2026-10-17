import { mergeQueuedUpdate } from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isActiveSessionConflict, isConnectivityError, isPrimaryKeyConflict } from './connectivity'
import { db, listQueue, type QueueRow } from './local-db'

let flushing = false

export async function flushQueue(client: SupabaseClient, userId: string) {
  if (flushing) return
  flushing = true
  try {
    const ops = await listQueue(userId)
    for (const op of ops) {
      try {
        await applyOp(client, op)
        if (op.seq !== undefined) await db.queue.delete(op.seq)
      } catch (error) {
        if (isActiveSessionConflict(error)) {
          await db.queue.where('recordId').equals(op.recordId).delete()
          continue
        }
        return
      }
    }
  } finally {
    flushing = false
  }
}

async function applyOp(client: SupabaseClient, op: QueueRow) {
  if (op.kind === 'delete') {
    const { error } = await client.from(op.table).delete().eq('id', op.recordId)
    if (error && !isConnectivityError(error)) throw error
    if (error) throw error
    return
  }

  if (op.kind === 'insert') {
    const { error } = await client.from(op.table).insert(op.payload)
    if (!error || isPrimaryKeyConflict(error)) return
    throw error
  }

  const { data, error } = await client.from(op.table).select('*').eq('id', op.recordId).maybeSingle()
  if (error) throw error
  const merged = mergeQueuedUpdate(op.table, data as { updated_at: string } | null, {
    ...op.payload,
    updated_at: op.enqueuedAt,
  })
  if (!merged || !data) return
  const { error: writeError } = await client.from(op.table).update(merged).eq('id', op.recordId)
  if (writeError) throw writeError
}
