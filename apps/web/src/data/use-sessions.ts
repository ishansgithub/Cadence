import type { SessionStart } from '@cadence/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/useToast'
import { errorMessage } from './errors'
import { getSupabase } from '../lib/supabase'
import { sessionKeys } from './query-keys'
import { createOfflineSessionsRepo } from './offline-sessions'

export function publishSessionChange() {
  const channel = new BroadcastChannel('cadence-sessions')
  channel.postMessage('changed')
  channel.close()
}

function useRefreshSessions() {
  const queryClient = useQueryClient()
  return () => {
    publishSessionChange()
    return queryClient.invalidateQueries({ queryKey: sessionKeys.all })
  }
}

export function useActiveSession() {
  return useQuery({
    queryKey: sessionKeys.active,
    queryFn: () => createOfflineSessionsRepo(getSupabase()).getActive(),
  })
}

export function useSessionRange(from: string | null, to: string | null) {
  return useQuery({
    queryKey: sessionKeys.range(from ?? '', to ?? ''),
    queryFn: () => createOfflineSessionsRepo(getSupabase()).listRange(from ?? '', to ?? ''),
    enabled: from !== null && to !== null,
  })
}

export function useStartSession() {
  const refresh = useRefreshSessions()
  const toast = useToast()
  return useMutation({
    mutationFn: (input: SessionStart) => createOfflineSessionsRepo(getSupabase()).start(input),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void refresh(),
  })
}

export function useStopSession() {
  const refresh = useRefreshSessions()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ id, interrupted, reason }: { id: string; interrupted: boolean; reason: string | null }) =>
      createOfflineSessionsRepo(getSupabase()).stop(id, interrupted, reason),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void refresh(),
  })
}

export function useCompleteSession() {
  const refresh = useRefreshSessions()
  const toast = useToast()
  return useMutation({
    mutationFn: (id: string) => createOfflineSessionsRepo(getSupabase()).complete(id),
    onError: (error) => toast.showError(errorMessage(error)),
    onSettled: () => void refresh(),
  })
}
