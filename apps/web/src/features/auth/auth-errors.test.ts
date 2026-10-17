import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './auth-errors'

describe('authErrorMessage', () => {
  it('explains a wrong password', () => {
    expect(authErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'Wrong email or password.',
    )
  })

  it('explains an unconfirmed email', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed', message: 'Email not confirmed' })).toBe(
      'Confirm your email before signing in. Check your inbox for the confirmation link.',
    )
  })

  it('explains a network failure', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Network error. Check your connection and try again.',
    )
    expect(authErrorMessage({ message: 'Failed to fetch', status: 0 })).toBe(
      'Network error. Check your connection and try again.',
    )
  })
})
