import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from 'motion/react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import type { Tone } from '../../lib/palette'

export function RotatingRing({
  text,
  separator = '•',
  repeats = 3,
  size = 200,
  fontSize,
  spinning = true,
  speed = 16,
  boost = 3.2,
  hovered: hoveredProp,
  className = '',
  children,
}: {
  text: string
  separator?: string
  repeats?: number
  size?: number
  fontSize?: number
  spinning?: boolean
  speed?: number
  boost?: number
  hovered?: boolean
  className?: string
  children?: ReactNode
}) {
  const id = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const [hoveredSelf, setHoveredSelf] = useState(false)
  const hovered = hoveredProp ?? hoveredSelf
  const rotate = useMotionValue(0)
  const velocity = useSpring(spinning ? speed : 0, { stiffness: 40, damping: 16 })

  useEffect(() => {
    velocity.set(!spinning ? 0 : hovered ? speed * boost : speed)
  }, [boost, hovered, speed, spinning, velocity])

  useAnimationFrame((_, delta) => {
    if (reduced) return
    rotate.set((rotate.get() + (velocity.get() * delta) / 1000) % 360)
  })

  const glyph = fontSize ?? Math.max(10, Math.round(size * 0.068))
  const radius = size / 2 - glyph * 0.95
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const content = Array.from({ length: repeats }, () => `${text} ${separator} `).join('')

  return (
    <div
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
      onPointerEnter={() => setHoveredSelf(true)}
      onPointerLeave={() => setHoveredSelf(false)}
    >
      <motion.svg
        aria-hidden
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 overflow-visible text-foreground"
        style={{ rotate }}
      >
        <defs>
          <path
            id={`ring-${id}`}
            d={`M ${center},${center} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
          />
        </defs>
        <text
          fill="currentColor"
          style={{
            fontSize: glyph,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <textPath href={`#ring-${id}`} textLength={circumference - 2} lengthAdjust="spacing">
            {content}
          </textPath>
        </text>
      </motion.svg>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

const shapes = {
  play: <path d="M33 17c-4-2.4-8 .2-8 4.6v56.8c0 4.4 4 7 8 4.6l46-28.4c3.6-2.2 3.6-7 0-9.2L33 17Z" />,
  plus: (
    <path d="M38 12h24c2 0 4 2 4 4v18h18c2 0 4 2 4 4v24c0 2-2 4-4 4H66v18c0 2-2 4-4 4H38c-2 0-4-2-4-4V66H16c-2 0-4-2-4-4V38c0-2 2-4 4-4h18V16c0-2 2-4 4-4Z" />
  ),
  pause: (
    <>
      <rect x="20" y="14" width="22" height="72" rx="6" />
      <rect x="58" y="14" width="22" height="72" rx="6" />
    </>
  ),
  stop: <rect x="16" y="16" width="68" height="68" rx="12" />,
}

export type ShapeName = keyof typeof shapes

const frontVariants: Variants = {
  rest: { x: 0, y: 0 },
  hover: { x: -1.5, y: -2.5 },
  tap: { x: 5, y: 6 },
}

export function ExtrudedShape({ shape, size = 72 }: { shape: ShapeName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-4 -4 112 112" aria-hidden className="overflow-visible">
      <g
        transform="translate(6 7)"
        fill="var(--tone-slab)"
        stroke="var(--line)"
        strokeWidth={4.5}
        strokeLinejoin="round"
      >
        {shapes[shape]}
      </g>
      <motion.g
        variants={frontVariants}
        transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        fill="var(--surface)"
        stroke="var(--line)"
        strokeWidth={4.5}
        strokeLinejoin="round"
      >
        {shapes[shape]}
      </motion.g>
    </svg>
  )
}

export function RingButton({
  ringText,
  separator,
  shape = 'play',
  label,
  onClick,
  disabled,
  tone,
  size = 180,
  spinning = true,
  className = '',
}: {
  ringText: string
  separator?: string
  shape?: ShapeName
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: Tone
  size?: number
  spinning?: boolean
  className?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className={`${tone ? `tone-${tone}` : ''} ${className}`}>
      <RotatingRing text={ringText} separator={separator} size={size} spinning={spinning} hovered={hovered && !disabled}>
        <motion.button
          type="button"
          aria-label={label}
          title={label}
          disabled={disabled}
          onClick={onClick}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          initial="rest"
          animate="rest"
          whileHover={disabled ? undefined : 'hover'}
          whileTap={disabled ? undefined : 'tap'}
          className="grid place-items-center rounded-full p-2 disabled:opacity-50 active:!scale-100"
          style={{ width: size * 0.5, height: size * 0.5 }}
        >
          <ExtrudedShape shape={shape} size={size * 0.34} />
        </motion.button>
      </RotatingRing>
    </div>
  )
}
