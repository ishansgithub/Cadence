import type { SyncKind, SyncTable } from '@cadence/core'
import Dexie, { type Table } from 'dexie'

export type QueueRow = {
  seq?: number
  userId: string
  opId: string
  table: SyncTable
  kind: SyncKind
  recordId: string
  payload: Record<string, unknown>
  enqueuedAt: string
}

type CacheRow = {
  key: string
  payload: unknown
}

class CadenceDb extends Dexie {
  queue!: Table<QueueRow, number>
  cache!: Table<CacheRow, string>

  constructor() {
    super('cadence')
    this.version(1).stores({
      queue: '++seq, userId, recordId',
      cache: 'key',
    })
  }
}

export const db = new CadenceDb()

export async function enqueueWrite(row: Omit<QueueRow, 'seq' | 'opId' | 'enqueuedAt'>) {
  await db.queue.add({
    ...row,
    opId: crypto.randomUUID(),
    enqueuedAt: new Date().toISOString(),
  })
}

export async function listQueue(userId: string): Promise<QueueRow[]> {
  return db.queue.where('userId').equals(userId).sortBy('seq')
}

export async function pendingCount(userId: string): Promise<number> {
  return db.queue.where('userId').equals(userId).count()
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const row = await db.cache.get(key)
  return row ? (row.payload as T) : null
}

export async function cacheSet(key: string, payload: unknown) {
  await db.cache.put({ key, payload })
}
