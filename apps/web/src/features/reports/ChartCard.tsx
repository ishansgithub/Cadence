import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { ChunkyButton } from '../../components/ui/ChunkyButton'
import { Icon } from '../../components/ui/Icon'
import { Reveal } from '../../components/ui/motion'
import type { Tone } from '../../lib/palette'

export function ChartCard({
  title,
  insight,
  pending,
  error,
  onRetry,
  empty,
  table,
  tone = 'peach',
  className = '',
  children,
}: {
  title: string
  insight: string | null
  pending: boolean
  error: unknown
  onRetry: () => void
  empty: boolean
  table: ReactNode
  tone?: Tone
  className?: string
  children: ReactNode
}) {
  const [tableOpen, setTableOpen] = useState(false)

  return (
    <Reveal className={className} y={20}>
      <section className={`chunky tone-${tone} h-full p-5`}>
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <span aria-hidden className="size-3 rounded-full border-2 border-line bg-tone-slab" />
          {title}
        </h2>
        {pending ? (
          <div className="mt-3 space-y-3" aria-busy="true" aria-label={`Loading ${title}`}>
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-56" />
          </div>
        ) : error ? (
          <div className="mt-3 rounded-[var(--radius-md)] bg-danger-surface px-4 py-3 text-sm text-danger" role="alert">
            <p>{error instanceof Error ? error.message : 'Could not load this chart.'}</p>
            <ChunkyButton size="sm" className="mt-2" onClick={onRetry}>
              Retry
            </ChunkyButton>
          </div>
        ) : empty ? (
          <div className="mt-3">
            <EmptyState mascot={null} title="Nothing here yet" body="Finish a focus session and it will show up here." />
          </div>
        ) : (
          <>
            {insight ? <p className="mt-1.5 text-sm text-muted">{insight}</p> : null}
            <div className="mt-4">{children}</div>
            <div className="mt-3">
              <button
                type="button"
                aria-expanded={tableOpen}
                onClick={() => setTableOpen((open) => !open)}
                className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-muted hover:bg-foreground/5 hover:text-foreground"
              >
                {tableOpen ? 'Hide data table' : 'Show data table'}
                <motion.span animate={{ rotate: tableOpen ? 180 : 0 }} className="inline-flex" aria-hidden>
                  <Icon name="chevron-down" size={15} strokeWidth={2.4} />
                </motion.span>
              </button>
              {tableOpen ? null : <div className="sr-only">{table}</div>}
              <AnimatePresence initial={false}>
                {tableOpen ? (
                  <motion.div
                    key="table"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="overflow-x-auto">{table}</div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </>
        )}
      </section>
    </Reveal>
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
        <tr className="border-b-2 border-line text-muted">
          {columns.map((column) => (
            <th key={column} scope="col" className="px-2 py-2 font-semibold">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-border transition-colors hover:bg-tone/60">
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
