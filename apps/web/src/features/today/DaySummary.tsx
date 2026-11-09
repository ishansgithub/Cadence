export function DaySummary({
  focusMinutes,
  doneCount,
  plannedCount,
}: {
  focusMinutes: number
  doneCount: number
  plannedCount: number
}) {
  const focusLabel =
    focusMinutes < 1 ? '0 min' : focusMinutes < 60 ? `${Math.round(focusMinutes)} min` : `${(focusMinutes / 60).toFixed(1)} h`

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">Focus so far</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{focusLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">Tasks</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
            <span className="text-done">{doneCount}</span>
            <span className="text-muted"> / </span>
            {plannedCount}
            <span className="ml-1 text-sm font-normal text-muted">planned</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
