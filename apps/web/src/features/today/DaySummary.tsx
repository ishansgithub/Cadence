import { motion } from 'motion/react'
import { StatBadge } from '../../components/ui/ChunkyCard'

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
  const ratio = plannedCount > 0 ? Math.min(1, doneCount / plannedCount) : 0

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatBadge tone="peach" label="Focus so far" value={focusLabel} hint="Today" />
      <StatBadge
        tone="sage"
        label="Tasks"
        value={
          <>
            {doneCount}
            <span className="text-muted"> / </span>
            {plannedCount}
          </>
        }
        hint={
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full border-[1.5px] border-line bg-surface">
            <motion.span
              className="block h-full rounded-full bg-tone-strong"
              initial={{ width: 0 }}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </span>
        }
      />
    </div>
  )
}
