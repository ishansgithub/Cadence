export function isConnectivityError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const message = errorText(error)
  return /failed to fetch|networkerror|network request failed|load failed|offline/i.test(message)
}

export function isPrimaryKeyConflict(error: unknown): boolean {
  return errorCode(error) === '23505' && !/one_active_session/i.test(errorText(error))
}

export function isActiveSessionConflict(error: unknown): boolean {
  return errorCode(error) === '23505' && /one_active_session/i.test(errorText(error))
}

function errorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') return error.code
  return ''
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String(error.message)
  return ''
}
