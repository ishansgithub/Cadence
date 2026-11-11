import { LayoutGroup, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../../components/ui/Icon'
import { applyTheme, readTheme, writeTheme, type ThemeChoice } from './theme'

const choices: { value: ThemeChoice; icon: IconName }[] = [
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'monitor' },
]

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readTheme() === 'system') applyTheme('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return (
    <LayoutGroup id="theme-toggle">
      <div className="chunky inline-flex gap-1 !rounded-full p-1.5" role="group" aria-label="Theme">
        {choices.map((item) => {
          const selected = choice === item.value
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                writeTheme(item.value)
                setChoice(item.value)
              }}
              className={`relative flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold capitalize ${
                selected ? 'text-ink-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                />
              ) : null}
              <motion.span
                className="relative inline-flex"
                animate={selected ? { rotate: [0, -25, 360], scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Icon name={item.icon} size={17} strokeWidth={2.3} />
              </motion.span>
              <span className="relative">{item.value}</span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
