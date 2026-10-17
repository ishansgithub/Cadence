import type { Task, TaskCreate, TaskStatus, TaskUpdate } from '@cadence/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/useToast'
import { errorMessage } from './errors'
import { getSupabase } from '../lib/supabase'
import { taskKeys } from './query-keys'
import { createOfflineTasksRepo } from './offline-tasks'

const placeholderUserId = '00000000-0000-4000-8000-000000000000'

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: () => createOfflineTasksRepo(getSupabase()).list(),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: TaskCreate) => createOfflineTasksRepo(getSupabase()).create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all)
      const optimistic = optimisticTask(input)
      queryClient.setQueryData<Task[]>(taskKeys.all, (current) => [...(current ?? []), optimistic])
      return { previous, optimisticId: optimistic.id }
    },
    onError: (error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous)
      toast.showError(errorMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskUpdate }) =>
      createOfflineTasksRepo(getSupabase()).update(id, input),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => createOfflineTasksRepo(getSupabase()).delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all)
      queryClient.setQueryData<Task[]>(taskKeys.all, (current) => current?.filter((task) => task.id !== id))
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous)
      toast.showError(errorMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function useSetTaskStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      createOfflineTasksRepo(getSupabase()).setStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all)
      queryClient.setQueryData<Task[]>(taskKeys.all, (current) =>
        current?.map((task) =>
          task.id === id
            ? { ...task, status, completed_at: status === 'done' ? new Date().toISOString() : null }
            : task,
        ),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous)
      toast.showError(errorMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

export function usePlanTask() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: string | null }) =>
      createOfflineTasksRepo(getSupabase()).plan(id, date),
    onMutate: async ({ id, date }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all })
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all)
      queryClient.setQueryData<Task[]>(taskKeys.all, (current) =>
        current?.map((task) => (task.id === id ? { ...task, planned_for: date } : task)),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.all, context.previous)
      toast.showError(errorMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  })
}

function optimisticTask(input: TaskCreate): Task {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    user_id: placeholderUserId,
    goal_id: input.goal_id ?? null,
    title: input.title,
    notes: input.notes ?? null,
    estimate_min: input.estimate_min ?? null,
    due_date: input.due_date ?? null,
    planned_for: input.planned_for ?? null,
    status: input.status ?? 'todo',
    completed_at: input.status === 'done' ? now : null,
    created_at: now,
    updated_at: now,
  }
}
