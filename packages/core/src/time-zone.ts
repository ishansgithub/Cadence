export function resolveTimeZone(timeZone: string | undefined): string {
  const trimmed = timeZone?.trim()
  if (!trimmed) return 'UTC'
  return trimmed
}
