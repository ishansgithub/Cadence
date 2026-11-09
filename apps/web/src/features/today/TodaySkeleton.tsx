function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-border/70 ${className ?? ''}`} />
}

export function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today" className="space-y-8">
      <Bone className="h-20 w-full rounded-xl" />
      <div className="space-y-3">
        <Bone className="h-4 w-24" />
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 border-b border-border py-3">
            <Bone className="size-5 shrink-0 rounded" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-4 w-12" />
            <Bone className="h-11 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
