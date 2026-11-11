const labels: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
  archived: 'Archived',
  todo: 'To do',
  in_progress: 'In progress',
}

const tones: Record<string, string> = {
  active: 'tone-sage',
  in_progress: 'tone-sky',
  paused: 'tone-butter',
  done: 'tone-sage',
}

export function StatusBadge({ status }: { status: string }) {
  const tone = tones[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-semibold ${
        tone ? `${tone} border-tone-slab bg-tone text-foreground` : 'border-border text-muted'
      }`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${tone ? 'bg-tone-strong' : 'bg-muted'}`} />
      {labels[status] ?? status}
    </span>
  )
}
