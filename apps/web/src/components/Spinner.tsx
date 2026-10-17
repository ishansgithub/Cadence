export function Spinner({ label, fullScreen = true }: { label: string; fullScreen?: boolean }) {
  return (
    <div
      className={fullScreen ? 'flex min-h-svh items-center justify-center' : 'flex items-center py-10'}
      role="status"
      aria-live="polite"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
