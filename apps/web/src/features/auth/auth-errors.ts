type ErrorRecord = {
  message?: unknown
  code?: unknown
  status?: unknown
}

function readError(error: unknown): { message: string; code: string; status?: number } {
  if (!error || typeof error !== 'object') {
    return { message: '', code: '' }
  }
  const record = error as ErrorRecord
  return {
    message: typeof record.message === 'string' ? record.message : '',
    code: typeof record.code === 'string' ? record.code : '',
    status: typeof record.status === 'number' ? record.status : undefined,
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  const { message, code, status } = readError(error)
  const lower = message.toLowerCase()
  return (
    status === 0 ||
    code === 'network_error' ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('fetch failed')
  )
}

export function authErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network error. Check your connection and try again.'
  }

  const { message, code, status } = readError(error)
  const lower = message.toLowerCase()

  if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
    return 'Wrong email or password.'
  }

  if (code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
    return 'Confirm your email before signing in. Check your inbox for the confirmation link.'
  }

  if (
    code === 'user_already_exists' ||
    lower.includes('already registered') ||
    lower.includes('already been registered')
  ) {
    return 'An account with this email already exists. Sign in instead.'
  }

  if (code === 'weak_password' || lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters.'
  }

  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many attempts. Wait a moment and try again.'
  }

  if (message) return message
  return 'Something went wrong. Try again.'
}

export function settingsErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network error. Check your connection and try again.'
  }
  return 'Could not save your settings. Refresh and try again.'
}
