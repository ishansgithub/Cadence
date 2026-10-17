import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getSupabase } from '../lib/supabase'
import { createReportsRepo } from './reports-repo'

export const reportKeys = {
  all: ['reports'] as const,
}

export function useReports() {
  const repo = useMemo(() => createReportsRepo(getSupabase()), [])
  return useQuery({
    queryKey: reportKeys.all,
    queryFn: () => repo.load(),
  })
}
