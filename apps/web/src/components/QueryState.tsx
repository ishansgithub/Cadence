import type { ReactNode } from 'react'
import { errorMessage } from '../data/errors'
import { EmptyState } from './EmptyState'
import { Spinner } from './Spinner'

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
  if (isPending) return <Spinner label={label} fullScreen={false} />
  if (isError) {
    return (
      <EmptyState
        title="Could not load this page"
        body={errorMessage(error)}
        action={
          <button type="button" onClick={onRetry} className="rounded-lg border border-border px-3 py-2 text-sm">
            Try again
          </button>
        }
      />
    )
  }
  return children
}
