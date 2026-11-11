export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'tone'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'chunky-btn bg-ink text-ink-foreground',
  secondary: 'chunky-btn bg-surface text-foreground',
  tone: 'chunky-btn bg-tone text-foreground',
  danger: 'chunky-btn bg-danger-surface text-danger [--tone-slab:var(--rose-slab)]',
  ghost:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground hover:bg-foreground/5 active:bg-foreground/10',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: '!min-h-9 !px-3.5 !text-[0.8125rem]',
  md: '',
  lg: '!min-h-13 !px-6 !text-base',
}

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra = '') {
  return `${variantClass[variant]} ${sizeClass[size]} ${extra}`.trim()
}
