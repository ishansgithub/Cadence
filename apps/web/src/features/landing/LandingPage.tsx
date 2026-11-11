import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { buttonClass } from '../../components/ui/buttonClass'
import { Icon } from '../../components/ui/Icon'
import { Logo } from '../../components/ui/Logo'
import { useAuth } from '../auth/useAuth'
import { writeTheme } from '../settings/theme'
import { HeroDemo } from './HeroDemo'
import { ClosingCta, FeatureBento, HowItWorks, MascotMarquee, WordMarquee } from './LandingSections'

const headline = ['Plan', 'the', 'day.', 'See', 'where', 'the', 'time', 'goes.']

function ThemeSwitch() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      onClick={() => {
        const next = dark ? 'light' : 'dark'
        writeTheme(next)
        setDark(!dark)
      }}
      className="chunky-btn grid !size-11 !p-0 bg-surface"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="inline-flex"
        >
          <Icon name={dark ? 'moon' : 'sun'} size={19} strokeWidth={2.3} />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function LandingPage() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const primary = user ? (
    <Link to="/today" className={buttonClass('primary', 'lg', 'tone-peach')}>
      Open the app
      <Icon name="arrow-right" size={18} strokeWidth={2.4} />
    </Link>
  ) : (
    <Link to="/login" className={buttonClass('primary', 'lg', 'tone-peach')}>
      Get started free
      <Icon name="arrow-right" size={18} strokeWidth={2.4} />
    </Link>
  )

  return (
    <div className="min-h-svh overflow-x-clip">
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-accent"
      />

      <header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          scrolled ? 'bg-background/80 shadow-[0_2px_0_0_var(--line)] backdrop-blur-md' : ''
        }`}
      >
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 md:px-8">
          <Link to="/" className="rounded-full" aria-label="Cadence home">
            <Logo />
          </Link>
          <div className="ml-6 hidden items-center gap-1 md:flex">
            {[
              ['#features', 'Features'],
              ['#how', 'How it works'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted hover:bg-foreground/5 hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <ThemeSwitch />
            {user ? (
              <Link to="/today" className={buttonClass('primary', 'md', 'tone-peach')}>
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className={buttonClass('ghost', 'md', 'max-sm:hidden')}>
                  Sign in
                </Link>
                <Link to="/login" className={buttonClass('primary', 'md', 'tone-peach')}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="dot-grid relative">
          <div
            aria-hidden
            className="tone-peach pointer-events-none absolute top-10 -left-40 size-[34rem] rounded-full bg-tone opacity-80 blur-3xl"
          />
          <div
            aria-hidden
            className="tone-sage pointer-events-none absolute -right-32 bottom-0 size-[30rem] rounded-full bg-tone opacity-80 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-24 px-4 lg:gap-16 pt-12 pb-24 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-32">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface py-1 pr-3.5 pl-1.5 text-sm font-semibold shadow-[2px_4px_0_0_var(--sand-slab)]"
              >
                <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-ink-foreground">New</span>
                Focus timer, tasks, and goals in one place
              </motion.p>
              <h1 className="mt-6 text-[clamp(3rem,7vw,5.75rem)] leading-[0.95] font-extrabold tracking-[-0.035em]">
                {headline.map((word, index) => (
                  <span key={index} className="inline-block overflow-hidden pr-[0.22em] pb-[0.08em] align-bottom">
                    <motion.span
                      className={`inline-block ${index >= 6 ? 'text-accent' : ''}`}
                      initial={{ y: '105%', rotate: 6 }}
                      animate={{ y: 0, rotate: 0 }}
                      transition={{ delay: 0.1 + index * 0.06, type: 'spring', stiffness: 180, damping: 18 }}
                    >
                      {word}
                    </motion.span>
                    {index === 2 ? <br className="hidden sm:block" /> : null}
                  </span>
                ))}
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="mt-6 max-w-lg text-lg text-muted md:text-xl"
              >
                Cadence is a calm little focus app. Plan today, start a session with one click, and watch your
                hours bloom into a heatmap, without streaks or guilt.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                {primary}
                <a href="#how" className={buttonClass('secondary', 'lg')}>
                  See how it works
                </a>
              </motion.div>
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted"
              >
                {['Works offline', 'Installable app', 'Light and dark', 'Export any time'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Icon name="check" size={16} strokeWidth={3} className="text-done" />
                    {item}
                  </li>
                ))}
              </motion.ul>
            </div>
            <HeroDemo />
          </div>
        </section>

        <WordMarquee />
        <FeatureBento />
        <HowItWorks />
        <MascotMarquee />
        <ClosingCta>
          {primary}
          {!user ? (
            <Link to="/login" className={buttonClass('secondary', 'lg')}>
              I have an account
            </Link>
          ) : null}
        </ClosingCta>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-8">
          <Logo size={28} />
          <p className="text-sm text-muted">Plan the day. See where the time goes. MIT licensed.</p>
          <div className="flex gap-1">
            <a
              href="#features"
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-foreground/5 hover:text-foreground"
            >
              Features
            </a>
            <Link
              to={user ? '/today' : '/login'}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-foreground/5 hover:text-foreground"
            >
              {user ? 'Open app' : 'Sign in'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
