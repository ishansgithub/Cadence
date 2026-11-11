import type { ReactNode } from 'react'
import { errorMessage } from '../data/errors'
import { EmptyState } from './EmptyState'
import { ChunkyButton } from './ui/ChunkyButton'

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
        <div className="skeleton h-9 w-44" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
    )
  }
  if (isError) {
    return (
      <EmptyState
        title="Could not load this page"
        body={errorMessage(error)}
        action={
          <ChunkyButton onClick={onRetry}>Try again</ChunkyButton>
        }
      />
    )
  }
  return children
}
