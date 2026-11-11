import { emojiFor, toneFor } from '../lib/palette'

export function GoalChip({ title, id }: { title: string; id?: string | null }) {
  const tone = toneFor(id ?? title)
  return (
    <span
      className={`tone-${tone} inline-flex max-w-[11rem] items-center gap-1 truncate rounded-full border-[1.5px] border-tone-slab bg-tone px-2.5 py-0.5 text-xs font-medium text-foreground`}
    >
      <span aria-hidden>{emojiFor(id ?? title)}</span>
      <span className="truncate">{title}</span>
    </span>
  )
}
