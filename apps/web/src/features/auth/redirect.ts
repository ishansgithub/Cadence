const RETURN_PATHS = new Set(['/today', '/tasks', '/goals', '/reports', '/settings'])

export function sanitizeReturnPath(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return '/today'
  }

  const pathOnly = from.split(/[?#]/)[0]
  if (!pathOnly || !RETURN_PATHS.has(pathOnly)) return '/today'
  return from
}
