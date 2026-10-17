const labels: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  done: 'Done',
  archived: 'Archived',
  todo: 'To do',
  in_progress: 'In progress',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
      {labels[status] ?? status}
    </span>
  )
}
