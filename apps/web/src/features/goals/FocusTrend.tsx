import type { DailyPoint } from '@cadence/core'
import { motion } from 'motion/react'
import { useId } from 'react'

export function FocusTrend({ points }: { points: DailyPoint[] }) {
  const gradientId = useId()
  const max = Math.max(1, ...points.map((point) => point.focusMin))
  const width = 280
  const height = 72
  const pad = 6
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = pad + index * step
    const y = height - pad - (point.focusMin / max) * (height - pad * 2)
    return [x, y] as const
  })
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ')
  const area = coords.length
    ? `M${coords[0][0]},${height} L${line.replace(/ /g, ' L')} L${coords[coords.length - 1][0]},${height} Z`
    : ''
  const total = points.reduce((sum, point) => sum + point.focusMin, 0)
  const label =
    total < 1 ? 'No focus in the last 14 days' : `${Math.round(total)} min across the last 14 days`

  return (
    <div className="chunky p-5">
      <p className="font-display text-lg font-bold">Time spent</p>
      <p className="mt-0.5 text-sm tabular-nums text-muted">{label}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-20 w-full overflow-visible" role="img" aria-label={label}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--tone-slab)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--tone-slab)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {area ? (
          <motion.path
            d={area}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          />
        ) : null}
        <motion.polyline
          fill="none"
          stroke="var(--line)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {coords.map(([x, y], index) =>
          points[index].focusMin > 0 ? (
            <motion.circle
              key={points[index].day}
              cx={x}
              cy={y}
              r={3.5}
              fill="var(--surface)"
              stroke="var(--line)"
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.03, type: 'spring', stiffness: 500, damping: 20 }}
            />
          ) : null,
        )}
      </svg>
    </div>
  )
}
