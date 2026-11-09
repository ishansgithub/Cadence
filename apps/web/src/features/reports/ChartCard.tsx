import { useState, type ReactNode } from 'react'
import { EmptyState } from '../../components/EmptyState'

export function ChartCard({
  title,
  insight,
  pending,
  error,
  onRetry,
  empty,
  table,
  children,
}: {
  title: string
  insight: string | null
  pending: boolean
  error: unknown
  onRetry: () => void
  empty: boolean
  table: ReactNode
  children: ReactNode
}) {
  const [tableOpen, setTableOpen] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
      {pending ? (
        <div className="mt-3 space-y-3" aria-busy="true" aria-label={`Loading ${title}`}>
          <div className="h-4 w-3/4 animate-pulse rounded bg-border/70" />
          <div className="h-56 animate-pulse rounded-xl bg-border/50" />
        </div>
      ) : error ? (
        <div className="mt-3 rounded-xl border border-danger/30 bg-danger-surface px-3 py-3 text-sm text-danger" role="alert">
          <p>{error instanceof Error ? error.message : 'Could not load this chart.'}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 min-h-11 rounded-lg border border-border bg-surface px-3 text-foreground"
          >
            Retry
          </button>
        </div>
      ) : empty ? (
        <div className="mt-3">
          <EmptyState title="Nothing here yet" body="Finish a focus session and it will show up here." />
        </div>
      ) : (
        <>
          {insight ? <p className="mt-2 text-sm text-muted">{insight}</p> : null}
          <div className="mt-3">{children}</div>
          <div className="mt-3">
            <button
              type="button"
              aria-expanded={tableOpen}
              onClick={() => setTableOpen((open) => !open)}
              className="min-h-11 text-sm font-medium text-accent"
            >
              {tableOpen ? 'Hide data table' : 'Show data table'}
            </button>
            <div className={tableOpen ? 'mt-2' : 'sr-only'}>{table}</div>
          </div>
        </>
      )}
    </section>
  )
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: string[]
  rows: Array<Array<string | number>>
}) {
  return (
    <table className="w-full min-w-[16rem] border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border text-muted">
          {columns.map((column) => (
            <th key={column} scope="col" className="px-2 py-2 font-medium">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-border/70">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-2 py-2 tabular-nums">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
