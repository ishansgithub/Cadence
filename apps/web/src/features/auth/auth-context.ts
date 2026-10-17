import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'

export type SignUpResult = {
  needsEmailConfirmation: boolean
  alreadyRegistered: boolean
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  configError: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signInWithMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
