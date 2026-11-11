import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import type { Tone } from '../../lib/palette'

export function ChunkyCard({
  tone,
  tinted = false,
  hover = false,
  soft = false,
  className = '',
  children,
  ...rest
}: {
  tone?: Tone
  tinted?: boolean
  hover?: boolean
  soft?: boolean
  className?: string
  children: ReactNode
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const classes = [
    soft ? 'chunky-soft' : 'chunky',
    tone ? `tone-${tone}` : '',
    tinted ? 'chunky-tone' : '',
    hover ? 'chunky-hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <motion.div className={classes} {...rest}>
      {children}
    </motion.div>
  )
}

export function Pill({
  children,
  tone,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-medium ${
        tone ? `tone-${tone} border-tone-slab bg-tone text-foreground` : 'border-border bg-surface text-muted'
      } ${className}`}
    >
      {children}
    </span>
  )
}

export function StatBadge({
  label,
  value,
  hint,
  tone,
  testId,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: Tone
  testId?: string
}) {
  return (
    <ChunkyCard tone={tone} tinted={Boolean(tone)} hover className="px-4 py-3.5">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p
        className="font-display mt-1 text-2xl font-bold tabular-nums tracking-tight"
        data-testid={testId}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </ChunkyCard>
  )
}

export function EmojiBadge({ emoji, tone, size = 40 }: { emoji: string; tone?: Tone; size?: number }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-line bg-tone ${
        tone ? `tone-${tone}` : ''
      }`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {emoji}
    </span>
  )
}
