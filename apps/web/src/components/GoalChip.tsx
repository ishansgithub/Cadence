export function GoalChip({ title }: { title: string }) {
  return (
    <span className="inline-block max-w-[10rem] truncate rounded-xl border border-border bg-background px-2 py-1 text-xs text-muted">
      {title}
    </span>
  )
}
