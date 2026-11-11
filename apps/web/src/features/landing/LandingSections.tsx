import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, useState, type ReactNode } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Mascot, type MascotName } from '../../components/ui/Mascot'
import { Reveal } from '../../components/ui/motion'
import { RotatingRing } from '../../components/ui/RotatingRing'
import type { Tone } from '../../lib/palette'

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: ReactNode; body?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface px-3 py-1 text-xs font-bold tracking-[0.18em] uppercase">
        <span aria-hidden>✦</span> {eyebrow}
      </p>
      <h2 className="mt-4 text-4xl leading-[1.05] font-extrabold md:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-lg text-muted">{body}</p> : null}
    </Reveal>
  )
}

function BentoCard({
  tone,
  className = '',
  delay = 0,
  children,
}: {
  tone: Tone
  className?: string
  delay?: number
  children: ReactNode
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotate: -1 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay, type: 'spring', stiffness: 160, damping: 20 }}
      whileHover={{ rotate: -0.8, y: -6 }}
      className={`tone-${tone} chunky chunky-tone group relative overflow-hidden p-6 hover:!shadow-[6px_12px_0_0_var(--tone-slab)] ${className}`}
    >
      {children}
    </motion.article>
  )
}

function MiniBars() {
  const bars = [38, 62, 45, 80, 56, 92, 70]
  return (
    <div className="mt-6 flex h-32 items-end gap-2.5" aria-hidden>
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className={`flex-1 rounded-t-[10px] border-2 border-line transition-colors duration-300 ${
            height === Math.max(...bars) ? 'bg-tone-strong' : 'bg-tone-slab group-hover:bg-surface'
          }`}
          initial={{ height: 0 }}
          whileInView={{ height: `${height}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + index * 0.07, type: 'spring', stiffness: 140, damping: 16 }}
        />
      ))}
    </div>
  )
}

function MiniTasks() {
  const [done, setDone] = useState<number[]>([0])
  const items = [
    { title: 'Outline the essay', meta: '#writing ~45m' },
    { title: 'Reply to Sam', meta: '~10m !today' },
    { title: 'Morning run', meta: '#running' },
  ]
  return (
    <ul className="mt-5 space-y-2">
      {items.map((item, index) => {
        const checked = done.includes(index)
        return (
          <li key={item.title}>
            <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border-2 border-line bg-surface px-3 py-2.5 transition-transform duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setDone((current) => (checked ? current.filter((value) => value !== index) : [...current, index]))
                }
              />
              <span className={`flex-1 text-sm font-medium ${checked ? 'text-muted line-through decoration-2' : ''}`}>
                {item.title}
              </span>
              <span className="text-xs text-muted">{item.meta}</span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

export function FeatureBento() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 md:px-8">
      <SectionHeading
        eyebrow="What's inside"
        title={
          <>
            Small tools that <span className="text-accent">add up</span>.
          </>
        }
        body="Everything you need to plan a day, protect your focus, and look back honestly at where the hours went."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-6">
        <BentoCard tone="peach" className="md:col-span-4">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <RotatingRing text="Stay with it" separator="✦" size={190} speed={12}>
              <span className="font-display block text-3xl font-extrabold tabular-nums">24:59</span>
            </RotatingRing>
            <div>
              <h3 className="text-2xl font-bold">A timer that keeps its place</h3>
              <p className="mt-2 text-muted">
                Sessions are stored as a start time, so refreshes, sleep, and closed tabs never reset your count. Short
                and long breaks come around on their own.
              </p>
            </div>
          </div>
        </BentoCard>
        <BentoCard tone="sky" className="md:col-span-2" delay={0.08}>
          <Icon name="cloud-off" size={34} strokeWidth={2.2} />
          <h3 className="mt-4 text-2xl font-bold">Works offline</h3>
          <p className="mt-2 text-muted">Start and stop sessions without a connection. Changes sync when you're back.</p>
          <Mascot name="bear" className="absolute -right-4 -bottom-4 size-24 rotate-6 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-2 group-hover:rotate-0" />
        </BentoCard>
        <BentoCard tone="sage" className="md:col-span-3" delay={0.05}>
          <h3 className="text-2xl font-bold">Tasks tied to goals</h3>
          <p className="mt-2 text-muted">
            Type <code className="font-semibold text-foreground">#goal ~30m !tomorrow</code> and it lands in the right
            place. Try the checkboxes.
          </p>
          <MiniTasks />
        </BentoCard>
        <BentoCard tone="lilac" className="md:col-span-3" delay={0.1}>
          <h3 className="text-2xl font-bold">Reports that tell the truth</h3>
          <p className="mt-2 text-muted">
            Focus per day, time by goal, estimates against reality, and the hours you do your best work.
          </p>
          <MiniBars />
        </BentoCard>
        <BentoCard tone="butter" className="md:col-span-2" delay={0.05}>
          <div className="flex gap-2" aria-hidden>
            {['n', 'space', '?'].map((key) => (
              <kbd
                key={key}
                className="rounded-lg border-2 border-line bg-surface px-2.5 py-1 font-mono text-sm font-bold shadow-[2px_3px_0_0_var(--tone-slab)] transition-transform group-hover:-translate-y-0.5"
              >
                {key}
              </kbd>
            ))}
          </div>
          <h3 className="mt-4 text-2xl font-bold">Keyboard first</h3>
          <p className="mt-2 text-muted">Add a task, start the timer, or jump between pages without touching the mouse.</p>
        </BentoCard>
        <BentoCard tone="rose" className="md:col-span-4" delay={0.1}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex shrink-0 gap-3" aria-hidden>
              <span className="grid size-16 place-items-center rounded-2xl border-2 border-line bg-[#fbf8f1] text-[#1b1a17] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-rotate-6">
                <Icon name="sun" size={28} />
              </span>
              <span className="grid size-16 place-items-center rounded-2xl border-2 border-line bg-[#16150f] text-[#f4efe3] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:rotate-6">
                <Icon name="moon" size={28} />
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Light, dark, and installable</h3>
              <p className="mt-2 text-muted">
                A progressive web app you can pin to your dock, with a theme that follows your system or your mood.
              </p>
            </div>
          </div>
        </BentoCard>
      </div>
    </section>
  )
}

const steps = [
  {
    title: 'Jot it down',
    body: 'Quick-add tasks with goals, estimates, and due dates in one line.',
    tone: 'peach' as Tone,
    emoji: '✏️',
  },
  {
    title: 'Press play',
    body: 'Start a focus session on any task. Breaks queue themselves up.',
    tone: 'sage' as Tone,
    emoji: '▶️',
  },
  {
    title: 'Look back',
    body: 'Heatmaps and reports show where the week actually went.',
    tone: 'lilac' as Tone,
    emoji: '📈',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  const scaleX = useTransform(progress, [0, 1], [0, 1])

  return (
    <section id="how" className="scroll-mt-24 border-y-2 border-line bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <SectionHeading eyebrow="How it works" title="Three steps. No streak guilt." />
        <div ref={ref} className="relative mt-16">
          <div className="absolute top-10 right-[16%] left-[16%] hidden h-1 rounded-full bg-border md:block" aria-hidden>
            <motion.div style={{ scaleX }} className="h-full origin-left rounded-full bg-ink" />
          </div>
          <ol className="grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: index * 0.15, type: 'spring', stiffness: 160, damping: 20 }}
                className={`tone-${step.tone} relative text-center`}
              >
                <motion.span
                  whileHover={{ rotate: 12, scale: 1.08 }}
                  className="chunky chunky-tone relative z-10 mx-auto grid size-20 place-items-center !rounded-full text-3xl"
                >
                  <span aria-hidden>{step.emoji}</span>
                  <span className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full border-2 border-line bg-ink font-display text-sm font-bold text-ink-foreground">
                    {index + 1}
                  </span>
                </motion.span>
                <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-muted">{step.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

const mascotCards: { name: MascotName; label: string; tone: Tone }[] = [
  { name: 'fox', label: 'Stay curious', tone: 'sky' },
  { name: 'bear', label: 'Sip and focus', tone: 'sage' },
  { name: 'owl', label: 'Take notes', tone: 'lilac' },
  { name: 'cat', label: 'On the clock', tone: 'peach' },
  { name: 'rabbit', label: 'Keep moving', tone: 'rose' },
  { name: 'frog', label: 'Breathe', tone: 'butter' },
]

export function MascotMarquee() {
  const row = [...mascotCards, ...mascotCards]
  return (
    <section className="overflow-hidden py-24" aria-label="Cadence mascots">
      <SectionHeading
        eyebrow="Meet the crew"
        title="A little company while you work."
        body="Friendly faces for quiet moments, never nagging, never counting your misses."
      />
      <div className="group/marquee mt-14 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex w-max animate-[cadence-marquee_40s_linear_infinite] gap-6 px-3 group-hover/marquee:[animation-play-state:paused]">
          {row.map((card, index) => (
            <motion.figure
              key={`${card.name}-${index}`}
              whileHover={{ y: -10, rotate: index % 2 ? 2 : -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              className={`tone-${card.tone} chunky relative w-56 shrink-0 overflow-hidden !rounded-[var(--radius-xl)]`}
              aria-hidden={index >= mascotCards.length}
            >
              <Mascot name={card.name} framed={false} className="aspect-square w-full" />
              <figcaption className="absolute inset-x-3 bottom-3 rounded-[10px] border-2 border-line bg-surface px-2 py-1.5 text-center font-display text-sm font-bold tracking-wide uppercase">
                {card.label}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function WordMarquee() {
  const words = ['Focus', 'Plan', 'Track', 'Rest', 'Repeat']
  const row = [...words, ...words, ...words, ...words]
  return (
    <div className="relative -my-2 -rotate-[1.5deg] border-y-2 border-line bg-ink py-4 text-ink-foreground" aria-hidden>
      <div className="flex w-max animate-[cadence-marquee_28s_linear_infinite] items-center gap-8">
        {row.map((word, index) => (
          <span key={index} className="flex items-center gap-8 font-display text-3xl font-extrabold tracking-tight uppercase">
            {word}
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ClosingCta({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
      <Reveal>
        <div className="tone-butter chunky chunky-tone relative overflow-hidden !rounded-[2.25rem] px-6 py-14 text-center md:px-16 md:py-20">
          <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
          <motion.div
            className="absolute top-8 left-8 hidden md:block"
            animate={{ y: [0, -10, 0], rotate: [-8, -4, -8] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          >
            <Mascot name="frog" className="size-28" />
          </motion.div>
          <motion.div
            className="absolute right-8 bottom-8 hidden md:block"
            animate={{ y: [0, -12, 0], rotate: [8, 4, 8] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          >
            <Mascot name="cat" className="size-28" />
          </motion.div>
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-4xl leading-[1.05] font-extrabold md:text-6xl">Ready when you are.</h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-muted">
              Make an account in a few seconds. Your data stays yours, with export any time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
