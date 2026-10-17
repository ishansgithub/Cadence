import type { Goal, GoalCreate, GoalUpdate } from '@cadence/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/useToast'
import { errorMessage } from './errors'
import { createGoalsRepo } from './goals-repo'
import { getSupabase } from '../lib/supabase'
import { goalKeys } from './query-keys'

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: () => createGoalsRepo(getSupabase()).list(),
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: GoalCreate) => createGoalsRepo(getSupabase()).create(input),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GoalUpdate }) =>
      createGoalsRepo(getSupabase()).update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all })
      const previous = queryClient.getQueryData<Goal[]>(goalKeys.all)
      queryClient.setQueryData<Goal[]>(goalKeys.all, (current) =>
        current?.map((goal) => (goal.id === id ? { ...goal, ...input } : goal)),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(goalKeys.all, context.previous)
      toast.showError(errorMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  })
}

export function useArchiveGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => createGoalsRepo(getSupabase()).archive(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.all })
      const previous = queryClient.getQueryData<Goal[]>(goalKeys.all)
      queryClient.setQueryData<Goal[]>(goalKeys.all, (current) =>
        current?.map((goal) => (goal.id === id ? { ...goal, status: 'archived' } : goal)),
      )
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(goalKeys.all, context.previous)
      toast.showError(errorMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: goalKeys.all }),
  })
}
