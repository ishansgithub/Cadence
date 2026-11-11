export type MascotName = 'fox' | 'bear' | 'owl' | 'cat' | 'rabbit' | 'frog'

export function Mascot({
  name,
  className = '',
  alt = '',
  framed = true,
}: {
  name: MascotName
  className?: string
  alt?: string
  framed?: boolean
}) {
  return (
    <img
      src={`/mascots/${name}.jpg`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      loading="lazy"
      className={`select-none object-cover ${
        framed ? 'rounded-[var(--radius-md)] border-2 border-line shadow-[2px_4px_0_0_var(--sand-slab)]' : ''
      } ${className}`}
    />
  )
}
