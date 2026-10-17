import {
  filterTasks,
  taskCreateSchema,
  taskSchema,
  taskUpdateSchema,
  type Task,
  type TaskRepo,
  type TaskStatus,
} from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { currentUserId } from './account'
import { isConnectivityError } from './connectivity'
import { cacheGet, cacheSet, enqueueWrite, listQueue, type QueueRow } from './local-db'
import { createTasksRepo } from './tasks-repo'

export function createOfflineTasksRepo(client: SupabaseClient): TaskRepo {
  const remote = createTasksRepo(client)

  return {
    async list(filters) {
      const userId = await currentUserId(client)
      try {
        const tasks = await remote.list()
        await cacheSet(taskKey(userId), tasks)
        return applyFilters(projectTasks(tasks, await listQueue(userId)), filters)
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        const cached = (await cacheGet<Task[]>(taskKey(userId))) ?? []
        return applyFilters(projectTasks(cached, await listQueue(userId)), filters)
      }
    },

    async get(id) {
      const tasks = await this.list()
      const task = tasks.find((item) => item.id === id)
      if (!task) throw new Error('Task not found.')
      return task
    },

    async create(input) {
      const parsed = taskCreateSchema.parse(input)
      const userId = await currentUserId(client)
      const now = new Date().toISOString()
      const local = taskSchema.parse({
        id: crypto.randomUUID(),
        user_id: userId,
        goal_id: parsed.goal_id ?? null,
        title: parsed.title,
        notes: parsed.notes?.trim() ? parsed.notes.trim() : null,
        estimate_min: parsed.estimate_min ?? null,
        due_date: parsed.due_date ?? null,
        planned_for: parsed.planned_for ?? null,
        status: parsed.status ?? 'todo',
        completed_at: parsed.status === 'done' ? now : null,
        created_at: now,
        updated_at: now,
      })
      try {
        const { data, error } = await client.from('tasks').insert(local).select('*').single()
        if (error) throw error
        const saved = taskSchema.parse(data)
        await cacheSet(taskKey(userId), upsert(await readTasks(userId), saved))
        return saved
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        await enqueueWrite({ userId, table: 'tasks', kind: 'insert', recordId: local.id, payload: local })
        await cacheSet(taskKey(userId), upsert(await readTasks(userId), local))
        return local
      }
    },

    async update(id, input) {
      const parsed = taskUpdateSchema.parse(input)
      const patch = {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes?.trim() ? parsed.notes.trim() : null } : {}),
        ...(parsed.estimate_min !== undefined ? { estimate_min: parsed.estimate_min } : {}),
        ...(parsed.due_date !== undefined ? { due_date: parsed.due_date } : {}),
        ...(parsed.planned_for !== undefined ? { planned_for: parsed.planned_for } : {}),
        ...(parsed.goal_id !== undefined ? { goal_id: parsed.goal_id } : {}),
        ...(parsed.status !== undefined ? completionPatch(parsed.status) : {}),
      }
      return writeTask(client, id, () => remote.update(id, input), patch)
    },

    async delete(id) {
      const userId = await currentUserId(client)
      try {
        await remote.delete(id)
      } catch (error) {
        if (!isConnectivityError(error)) throw error
        await enqueueWrite({ userId, table: 'tasks', kind: 'delete', recordId: id, payload: {} })
      }
      await cacheSet(
        taskKey(userId),
        (await readTasks(userId)).filter((task) => task.id !== id),
      )
    },

    async setStatus(id, status) {
      return writeTask(client, id, () => remote.setStatus(id, status), completionPatch(status))
    },

    async plan(id, date) {
      return writeTask(client, id, () => remote.plan(id, date), { planned_for: date })
    },
  }
}

async function writeTask(
  client: SupabaseClient,
  id: string,
  send: () => Promise<Task>,
  patch: Record<string, unknown>,
): Promise<Task> {
  const userId = await currentUserId(client)
  try {
    const saved = await send()
    await cacheSet(taskKey(userId), upsert(await readTasks(userId), saved))
    return saved
  } catch (error) {
    if (!isConnectivityError(error)) throw error
    const current = projectTasks(await readTasks(userId), await listQueue(userId)).find((task) => task.id === id)
    if (!current) throw error
    const next = taskSchema.parse({ ...current, ...patch, updated_at: new Date().toISOString() })
    await enqueueWrite({ userId, table: 'tasks', kind: 'update', recordId: id, payload: patch })
    await cacheSet(taskKey(userId), upsert(await readTasks(userId), next))
    return next
  }
}

function completionPatch(status: TaskStatus) {
  return {
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null,
  }
}

function taskKey(userId: string) {
  return `${userId}:tasks`
}

async function readTasks(userId: string): Promise<Task[]> {
  return (await cacheGet<Task[]>(taskKey(userId))) ?? []
}

function upsert(rows: Task[], task: Task): Task[] {
  const next = rows.filter((row) => row.id !== task.id)
  next.push(task)
  return next
}

function projectTasks(rows: Task[], ops: QueueRow[]): Task[] {
  const byId = new Map(rows.map((row) => [row.id, row]))
  for (const op of ops) {
    if (op.table !== 'tasks') continue
    if (op.kind === 'delete') byId.delete(op.recordId)
    if (op.kind === 'insert') byId.set(op.recordId, taskSchema.parse(op.payload))
    if (op.kind === 'update') {
      const current = byId.get(op.recordId)
      if (current) byId.set(op.recordId, taskSchema.parse({ ...current, ...op.payload }))
    }
  }
  return [...byId.values()]
}

function applyFilters(tasks: Task[], filters: Parameters<TaskRepo['list']>[0]) {
  let next = tasks
  if (filters?.status) next = next.filter((task) => task.status === filters.status)
  if (filters?.goalId !== undefined) next = next.filter((task) => task.goal_id === filters.goalId)
  if (filters?.plannedFor !== undefined) next = next.filter((task) => task.planned_for === filters.plannedFor)
  if (filters?.overdue) {
    if (!filters.today) throw new Error('An overdue task query needs today')
    next = next.filter(
      (task) =>
        task.due_date !== null &&
        task.due_date < filters.today! &&
        task.status !== 'done' &&
        task.status !== 'archived',
    )
  }
  return filters?.search ? filterTasks(next, { search: filters.search }) : next
}
