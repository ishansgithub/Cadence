import { useEffect, useState } from 'react'
import { applyTheme, readTheme, writeTheme, type ThemeChoice } from './theme'

const choices: ThemeChoice[] = ['light', 'dark', 'system']

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
    <div className="flex rounded-lg border border-border p-1" role="group" aria-label="Theme">
      {choices.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={choice === item}
          onClick={() => {
            writeTheme(item)
            setChoice(item)
          }}
          className={
            choice === item
              ? 'min-h-11 rounded-md bg-accent px-3 text-sm font-medium text-accent-foreground capitalize'
              : 'min-h-11 rounded-md px-3 text-sm capitalize'
          }
        >
          {item}
        </button>
      ))}
    </div>
  )
}
