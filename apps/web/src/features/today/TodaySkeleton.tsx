export function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today" className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
      <div className="space-y-2.5">
        <div className="skeleton h-5 w-28" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton h-14" style={{ animationDelay: `${index * 90}ms` }} />
        ))}
      </div>
    </div>
  )
}
