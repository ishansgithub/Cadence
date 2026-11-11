import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Mascot, type MascotName } from './ui/Mascot'

export function EmptyState({
  title,
  body,
  action,
  mascot = 'owl',
}: {
  title: string
  body: string
  action?: ReactNode
  mascot?: MascotName | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="dot-grid rounded-[var(--radius-lg)] border-2 border-dashed border-border px-4 py-10 text-center"
    >
      {mascot ? (
        <Mascot name={mascot} className="cadence-float mx-auto mb-3 size-24 object-contain" />
      ) : null}
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </motion.div>
  )
}
