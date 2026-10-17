import type { ReactNode } from 'react'
import { errorMessage } from '../data/errors'
import { EmptyState } from './EmptyState'

export function QueryState({
  isPending,
  isError,
  error,
  onRetry,
  label,
  children,
}: {
  isPending: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  label: string
  children: ReactNode
}) {
  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label={label}>
        <div className="h-8 w-40 animate-pulse rounded-lg bg-border" />
        <div className="h-24 animate-pulse rounded-2xl bg-border" />
        <div className="h-24 animate-pulse rounded-2xl bg-border" />
      </div>
    )
  }
  if (isError) {
    return (
      <EmptyState
        title="Could not load this page"
        body={errorMessage(error)}
        action={
          <button type="button" onClick={onRetry} className="min-h-11 rounded-lg border border-border px-3 text-sm">
            Try again
          </button>
        }
      />
    )
  }
  return children
}
