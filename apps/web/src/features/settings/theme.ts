export type ThemeChoice = 'light' | 'dark' | 'system'

const storageKey = 'cadence-theme'

export function readTheme(): ThemeChoice {
  const value = localStorage.getItem(storageKey)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

export function applyTheme(choice: ThemeChoice) {
  const dark =
    choice === 'dark' || (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#121410' : '#f4f1ea')
}

export function writeTheme(choice: ThemeChoice) {
  localStorage.setItem(storageKey, choice)
  applyTheme(choice)
}
