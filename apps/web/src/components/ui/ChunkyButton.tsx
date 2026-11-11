import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonClass'
import { Icon, type IconName } from './Icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  trailingIcon?: IconName
  loading?: boolean
}

export const ChunkyButton = forwardRef<HTMLButtonElement, Props>(function ChunkyButton(
  { variant = 'secondary', size = 'md', icon, trailingIcon, loading, className = '', children, type, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : icon ? (
        <Icon name={icon} size={size === 'lg' ? 20 : 17} strokeWidth={2.4} />
      ) : null}
      {children}
      {trailingIcon ? <Icon name={trailingIcon} size={size === 'lg' ? 20 : 17} strokeWidth={2.4} /> : null}
    </button>
  )
})

export function IconButton({
  icon,
  label,
  className = '',
  variant = 'secondary',
  size = 44,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string
  variant?: 'secondary' | 'primary' | 'ghost'
  size?: number
}) {
  const base =
    variant === 'ghost'
      ? 'inline-flex items-center justify-center rounded-full text-foreground hover:bg-foreground/5'
      : `chunky-btn !p-0 ${variant === 'primary' ? 'bg-ink text-ink-foreground' : 'bg-surface text-foreground'}`
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`${base} shrink-0 ${className}`}
      style={{ width: size, height: size, minHeight: size }}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.45)} strokeWidth={2.4} />
    </button>
  )
}
