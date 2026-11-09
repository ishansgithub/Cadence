import { useRef, useState, type ReactNode, type TouchEvent } from 'react'

const ACTION_WIDTH = 72
const MAX_OPEN = ACTION_WIDTH * 2

export function SwipeableRow({
  children,
  onComplete,
  onDelete,
  completeLabel,
}: {
  children: ReactNode
  onComplete: () => void
  onDelete: () => void
  completeLabel: string
}) {
  const startX = useRef(0)
  const startOffset = useRef(0)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  function onTouchStart(event: TouchEvent) {
    startX.current = event.touches[0]?.clientX ?? 0
    startOffset.current = offset
    setDragging(true)
  }

  function onTouchMove(event: TouchEvent) {
    const x = event.touches[0]?.clientX ?? startX.current
    const next = Math.min(0, Math.max(-MAX_OPEN, startOffset.current + (x - startX.current)))
    setOffset(next)
  }

  function onTouchEnd() {
    setDragging(false)
    setOffset((current) => (current < -ACTION_WIDTH ? -MAX_OPEN : 0))
  }

  return (
    <div className="relative overflow-hidden md:overflow-visible">
      <div
        className="absolute inset-y-0 right-0 flex md:hidden"
        aria-hidden={offset === 0}
      >
        <button
          type="button"
          onClick={() => {
            setOffset(0)
            onComplete()
          }}
          className="flex min-h-11 w-[72px] items-center justify-center bg-done-surface text-sm font-medium text-done"
        >
          {completeLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            setOffset(0)
            onDelete()
          }}
          className="flex min-h-11 w-[72px] items-center justify-center bg-danger-surface text-sm font-medium text-danger"
        >
          Delete
        </button>
      </div>
      <div
        className={`relative bg-background max-md:translate-x-[var(--swipe-x)] ${
          dragging ? '' : 'transition-transform duration-150 motion-reduce:transition-none'
        }`}
        style={{ ['--swipe-x' as string]: `${offset}px` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
