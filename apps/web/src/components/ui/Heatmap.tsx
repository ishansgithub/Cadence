import { motion, type Variants } from 'motion/react'
import type { Tone } from '../../lib/palette'

export type HeatCell = {
  key: string
  value: number
  label: string
}

const levelColor = [
  'color-mix(in srgb, var(--border) 75%, var(--surface))',
  'color-mix(in srgb, var(--tone-slab) 45%, var(--tone-bg))',
  'var(--tone-slab)',
  'color-mix(in srgb, var(--tone-slab) 50%, var(--tone-strong))',
  'var(--tone-strong)',
]

const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.012 } },
}

const cell: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 24 } },
}

function level(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0
  const ratio = value / max
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

export function Heatmap({
  cells,
  rows = 7,
  tone,
  cellSize = 18,
  gap = 4,
  ariaLabel,
  className = '',
}: {
  cells: HeatCell[]
  rows?: number
  tone?: Tone
  cellSize?: number
  gap?: number
  ariaLabel: string
  className?: string
}) {
  const max = Math.max(0, ...cells.map((item) => item.value))
  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      variants={grid}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      className={`grid w-max ${tone ? `tone-${tone}` : ''} ${className}`}
      style={{
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gridAutoColumns: `${cellSize}px`,
        gridAutoFlow: 'column',
        gap,
      }}
    >
      {cells.map((item) => (
        <motion.div
          key={item.key}
          variants={cell}
          whileHover={{ scale: 1.25, zIndex: 2 }}
          title={item.label}
          className="rounded-[5px]"
          style={{ backgroundColor: levelColor[level(item.value, max)] }}
        />
      ))}
    </motion.div>
  )
}
