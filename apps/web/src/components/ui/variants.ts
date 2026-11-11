import type { Variants } from 'motion/react'

export const spring = { type: 'spring', stiffness: 380, damping: 30 } as const
export const softSpring = { type: 'spring', stiffness: 220, damping: 26 } as const

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: softSpring },
  exit: { opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.2 } },
}
