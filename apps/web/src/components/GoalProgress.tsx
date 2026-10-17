export function GoalProgress({ progress, label }: { progress: number; label: string }) {
  const width = Math.max(0, Math.min(100, progress * 100))
  return (
    <div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  )
}
