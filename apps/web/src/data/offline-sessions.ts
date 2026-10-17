import {
  autoCompleteEnd,
  sessionSchema,
  sessionStartSchema,
  type Session,
  type SessionRepo,
} from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { currentUserId } from './account'
import { isActiveSessionConflict, isConnectivityError } from './connectivity'
import { cacheGet, cacheSet, enqueueWrite, listQueue, type QueueRow } from './local-db'
import { createSessionsRepo } from './sessions-repo'

const alreadyRunning = 'You already have a session running.'

export function createOfflineSessionsRepo(client: SupabaseClient): SessionRepo {
  const remote = createSessionsRepo(client)

  return {
    async getActive() {
      const userId = await currentUserId(client)
      try {
        const active = await remote.getActive()
        const cached = await readSessions(userId)
        const next = active ? upsert(cached, active) : cached.filter((session) => session.ended_at !== null)
        await cacheSet(sessionKey(userId), next)
        return openSession(projectSessions(next, await listQueue(userId)))
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        return openSession(projectSessions(await readSessions(userId), await listQueue(userId)))
      }
    },

    async start(input) {
      const parsed = sessionStartSchema.parse(input)
      const userId = await currentUserId(client)
      const now = new Date().toISOString()
      const local = sessionSchema.parse({
        id: crypto.randomUUID(),
        user_id: userId,
        task_id: parsed.task_id ?? null,
        type: parsed.type,
        planned_min: parsed.planned_min,
        started_at: now,
        ended_at: null,
        interrupted: false,
        interrupt_reason: null,
        created_at: now,
        updated_at: now,
      })
      try {
        const { data, error } = await client.from('sessions').insert(local).select('*').single()
        if (error) throw error
        const saved = sessionSchema.parse(data)
        await cacheSet(sessionKey(userId), upsert(await readSessions(userId), saved))
        return saved
      } catch (error) {
        if (isActiveSessionConflict(error)) throw new Error(alreadyRunning, { cause: error })
        if (!isConnectivityError(error)) throw error
        await enqueueWrite({ userId, table: 'sessions', kind: 'insert', recordId: local.id, payload: local })
        await cacheSet(sessionKey(userId), upsert(await readSessions(userId), local))
        return local
      }
    },

    async stop(id, interrupted, reason) {
      const userId = await currentUserId(client)
      const patch = {
        ended_at: new Date().toISOString(),
        interrupted,
        interrupt_reason: interrupted ? reason : null,
      }
      try {
        const saved = await remote.stop(id, interrupted, reason)
        await cacheSet(sessionKey(userId), upsert(await readSessions(userId), saved))
        return saved
      } catch (error) {
        if (!isConnectivityError(error) && !(await hasSession(userId, id))) throw error
        return queueSessionPatch(userId, id, patch)
      }
    },

    async complete(id) {
      const userId = await currentUserId(client)
      const local = openSession(projectSessions(await readSessions(userId), await listQueue(userId)))
      try {
        const saved = await remote.complete(id)
        if (saved) {
          await cacheSet(sessionKey(userId), upsert(await readSessions(userId), saved))
          return saved
        }
      } catch (error) {
        if (!isConnectivityError(error)) throw error
      }
      if (!local || local.id !== id) return null
      return queueSessionPatch(userId, id, {
        ended_at: autoCompleteEnd(local),
        interrupted: false,
        interrupt_reason: null,
      })
    },

    async listRange(from, to) {
      const userId = await currentUserId(client)
      try {
        const rows = await remote.listRange(from, to)
        const merged = rows.reduce(upsert, await readSessions(userId))
        await cacheSet(sessionKey(userId), merged)
        return projectSessions(merged, await listQueue(userId)).filter(
          (session) => session.started_at >= from && session.started_at < to,
        )
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        return projectSessions(await readSessions(userId), await listQueue(userId)).filter(
          (session) => session.started_at >= from && session.started_at < to,
        )
      }
    },
  }
}

async function queueSessionPatch(
  userId: string,
  id: string,
  patch: Pick<Session, 'ended_at' | 'interrupted' | 'interrupt_reason'>,
): Promise<Session> {
  const current = projectSessions(await readSessions(userId), await listQueue(userId)).find((session) => session.id === id)
  if (!current) throw new Error('That session is no longer active.')
  const next = sessionSchema.parse({ ...current, ...patch, updated_at: new Date().toISOString() })
  await enqueueWrite({ userId, table: 'sessions', kind: 'update', recordId: id, payload: { ...patch } })
  await cacheSet(sessionKey(userId), upsert(await readSessions(userId), next))
  return next
}

async function hasSession(userId: string, id: string) {
  return projectSessions(await readSessions(userId), await listQueue(userId)).some((session) => session.id === id)
}

function sessionKey(userId: string) {
  return `${userId}:sessions`
}

async function readSessions(userId: string): Promise<Session[]> {
  return (await cacheGet<Session[]>(sessionKey(userId))) ?? []
}

function upsert(rows: Session[], session: Session): Session[] {
  const next = rows.filter((row) => row.id !== session.id)
  next.push(session)
  return next
}

function projectSessions(rows: Session[], ops: QueueRow[]): Session[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  for (const op of ops) {
    if (op.table !== 'sessions') continue
    if (op.kind === 'delete') byId.delete(op.recordId)
    if (op.kind === 'insert') byId.set(op.recordId, sessionSchema.parse(op.payload))
    if (op.kind === 'update') {
      const current = byId.get(op.recordId)
      if (current) byId.set(op.recordId, sessionSchema.parse({ ...current, ...op.payload }))
    }
  }
  return [...byId.values()]
}

function openSession(rows: Session[]): Session | null {
  return rows.find((session) => session.ended_at === null) ?? null
}
