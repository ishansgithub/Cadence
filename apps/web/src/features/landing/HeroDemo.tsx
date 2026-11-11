import { formatCountdown } from '@cadence/core'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { EmojiBadge } from '../../components/ui/ChunkyCard'
import { Heatmap, type HeatCell } from '../../components/ui/Heatmap'
import { RingButton } from '../../components/ui/RotatingRing'
import type { Tone } from '../../lib/palette'

function demoCells(seed: number, count: number): HeatCell[] {
  return Array.from({ length: count }, (_, index) => {
    const raw = Math.sin((index + 1) * (seed + 3.1)) * 10000
    const noise = raw - Math.floor(raw)
    const value = noise < 0.35 ? 0 : Math.round(noise * 90)
    return { key: `${seed}-${index}`, value, label: value ? `${value} min` : 'No focus' }
  })
}

function DemoActivity({
  title,
  emoji,
  tone,
  total,
  ring,
  shape,
  seed,
  onRing,
}: {
  title: string
  emoji: string
  tone: Tone
  total: string
  ring: string
  shape: 'play' | 'plus' | 'pause'
  seed: number
  onRing: () => void
}) {
  return (
    <div className={`tone-${tone}`}>
      <div className="chunky flex items-center gap-3 px-4 py-3">
        <EmojiBadge emoji={emoji} tone={tone} size={38} />
        <span className="font-display flex-1 text-lg font-bold">{title}</span>
        <span className="text-right">
          <span className="font-display block text-lg font-bold tabular-nums text-tone-strong">{total}</span>
          <span className="block text-[11px] font-medium text-muted">This week</span>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <RingButton ringText={ring} separator={emoji} shape={shape} label={`${ring} for ${title}`} size={148} tone={tone} onClick={onRing} />
        <Heatmap cells={demoCells(seed, 35)} tone={tone} cellSize={17} gap={4} ariaLabel={`${title} focus over five weeks`} />
      </div>
    </div>
  )
}

export function HeroDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 18 })
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 })
  const shiftX = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 })
  const shiftY = useSpring(useTransform(py, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })
  const counterX = useTransform(shiftX, (value) => -value)
  const counterY = useTransform(shiftY, (value) => -value)
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSeconds((value) => (value <= 0 ? 25 * 60 : value - 1)), 1000)
    return () => window.clearInterval(id)
  }, [running])

  function onPointerMove(event: PointerEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    px.set((event.clientX - rect.left) / rect.width - 0.5)
    py.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
      className="relative mx-auto w-full max-w-[30rem] [perspective:1200px]"
    >
      <motion.div style={{ rotateX, rotateY }} className="relative space-y-7 [transform-style:preserve-3d]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 160, damping: 20 }}
        >
          <DemoActivity
            title="Reading"
            emoji="📚"
            tone="peach"
            total="9h 13m"
            ring={running ? 'Pause session' : 'Start session'}
            shape={running ? 'pause' : 'play'}
            seed={1}
            onRing={() => setRunning((value) => !value)}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 20 }}
        >
          <DemoActivity
            title="Running"
            emoji="👟"
            tone="sage"
            total="13 mi"
            ring="Add tally"
            shape="plus"
            seed={2}
            onRing={() => undefined}
          />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ x: shiftX, y: shiftY }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 16 }}
        className="tone-peach absolute -top-16 right-0 z-10 sm:-right-8"
      >
        <div className="chunky chunky-tone flex items-center gap-2.5 !rounded-full py-2 pr-4 pl-2.5">
          <span className="relative flex size-2.5" aria-hidden>
            {running ? <span className="absolute inset-0 animate-ping rounded-full bg-tone-strong opacity-70" /> : null}
            <span className="relative size-2.5 rounded-full bg-tone-strong" />
          </span>
          <span className="font-display text-lg font-bold tabular-nums">{formatCountdown(seconds)}</span>
          <span className="text-xs font-semibold text-muted">{running ? 'Focusing' : 'Paused'}</span>
        </div>
      </motion.div>

      <motion.div
        style={{ x: counterX, y: counterY }}
        initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: -6 }}
        transition={{ delay: 1, type: 'spring', stiffness: 240, damping: 14 }}
        className="tone-sky absolute -bottom-8 -left-4 z-10 sm:-left-12"
      >
        <div className="chunky flex items-center gap-2 !rounded-2xl px-3 py-2 text-sm font-semibold">
          <span className="grid size-6 place-items-center rounded-md border-2 border-line bg-ink text-ink-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Finish chapter 4
          <span className="rounded-full bg-tone px-2 py-0.5 text-xs">~30m</span>
        </div>
      </motion.div>
    </div>
  )
}
