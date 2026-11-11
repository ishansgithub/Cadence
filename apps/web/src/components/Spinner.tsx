export function Spinner({ label, fullScreen = true }: { label: string; fullScreen?: boolean }) {
  return (
    <div
      className={fullScreen ? 'flex min-h-svh items-center justify-center' : 'flex items-center py-10'}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-end gap-1.5" aria-hidden>
        {['tone-peach', 'tone-sage', 'tone-sky'].map((tone, index) => (
          <span
            key={tone}
            className={`${tone} size-3.5 animate-bounce rounded-full border-2 border-line bg-tone-slab`}
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
