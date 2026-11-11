import { appName } from '@cadence/core'
import { motion } from 'motion/react'

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <motion.span
      aria-hidden
      className="tone-peach relative inline-grid shrink-0 place-items-center rounded-full border-2 border-line bg-tone"
      style={{ width: size, height: size, boxShadow: '2px 3px 0 0 var(--tone-slab)' }}
      whileHover={{ rotate: 180 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14 }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M12 3a9 9 0 1 0 9 9" stroke="var(--line)" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="var(--line)" />
      </svg>
    </motion.span>
  )
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-display text-xl font-extrabold tracking-tight lowercase">{appName}</span>
    </span>
  )
}
