export function PlaceholderPage({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
    </section>
  )
}
