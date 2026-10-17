import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSupabase, missingSupabaseConfigMessage } from '../../lib/supabase'
import { authErrorMessage } from './auth-errors'
import { AuthContext, type SignUpResult } from './auth-context'

const redirectTo = () => `${window.location.origin}/login`

async function requireClient(client: SupabaseClient | null): Promise<SupabaseClient> {
  if (!client) throw new Error(missingSupabaseConfigMessage)
  return client
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client] = useState<SupabaseClient | null>(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  })
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(client !== null)
  const configError = client ? null : missingSupabaseConfigMessage

  useEffect(() => {
    if (!client) return

    let active = true
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) throw error
        setSession(data.session)
      })
      .catch(() => {
        if (!active) return
        setSession(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configError,
      async signIn(email: string, password: string) {
        const supabase = await requireClient(client)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(authErrorMessage(error))
      },
      async signUp(email: string, password: string): Promise<SignUpResult> {
        const supabase = await requireClient(client)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo() },
        })
        if (error) throw new Error(authErrorMessage(error))
        const alreadyRegistered = data.user?.identities?.length === 0
        return {
          alreadyRegistered,
          needsEmailConfirmation: !alreadyRegistered && !data.session,
        }
      },
      async signInWithMagicLink(email: string) {
        const supabase = await requireClient(client)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo() },
        })
        if (error) throw new Error(authErrorMessage(error))
      },
      async signOut() {
        const supabase = await requireClient(client)
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(authErrorMessage(error))
      },
    }),
    [client, configError, loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
