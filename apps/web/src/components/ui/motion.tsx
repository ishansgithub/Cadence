import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { staggerParent } from './variants'

export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  as = 'div',
  className = '',
  children,
  ...rest
}: {
  as?: 'div' | 'ul' | 'section'
  className?: string
  children: ReactNode
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const Component = as === 'ul' ? motion.ul : as === 'section' ? motion.section : motion.div
  return (
    <Component
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className={className}
      {...(rest as object)}
    >
      {children}
    </Component>
  )
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 28,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
