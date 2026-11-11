import { motion } from 'motion/react'

export function GoalProgress({ progress, label }: { progress: number; label: string }) {
  const width = Math.max(0, Math.min(100, progress * 100))
  return (
    <div>
      <div
        className="h-3 overflow-hidden rounded-full border-2 border-line bg-surface"
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className="h-full rounded-full bg-tone-strong"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{label}</p>
    </div>
  )
}
