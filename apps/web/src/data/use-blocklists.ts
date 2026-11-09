import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/useToast'
import { createBlocklistsRepo, type BlocklistInput } from './blocklists-repo'
import { errorMessage } from './errors'
import { getSupabase } from '../lib/supabase'

export const blocklistKeys = {
  all: ['blocklists'] as const,
}

export function useBlocklists() {
  return useQuery({
    queryKey: blocklistKeys.all,
    queryFn: () => createBlocklistsRepo(getSupabase()).list(),
  })
}

export function useCreateBlocklist() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: BlocklistInput) => createBlocklistsRepo(getSupabase()).create(input),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: blocklistKeys.all }),
  })
}

export function useUpdateBlocklist() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BlocklistInput }) =>
      createBlocklistsRepo(getSupabase()).update(id, input),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: blocklistKeys.all }),
  })
}

export function useDeleteBlocklist() {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => createBlocklistsRepo(getSupabase()).remove(id),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: blocklistKeys.all }),
  })
}
