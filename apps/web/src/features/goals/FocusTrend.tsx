import type { DailyPoint } from '@cadence/core'

export function FocusTrend({ points }: { points: DailyPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.focusMin))
  const width = 280
  const height = 64
  const pad = 4
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = pad + index * step
    const y = height - pad - (point.focusMin / max) * (height - pad * 2)
    return `${x},${y}`
  })
  const total = points.reduce((sum, point) => sum + point.focusMin, 0)
  const label =
    total < 1 ? 'No focus in the last 14 days' : `${Math.round(total)} min across the last 14 days`

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold tracking-wide">Time spent</p>
      <p className="mt-1 text-sm tabular-nums text-muted">{label}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 h-16 w-full text-accent"
        role="img"
        aria-label={label}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={coords.join(' ')}
        />
      </svg>
    </div>
  )
}
