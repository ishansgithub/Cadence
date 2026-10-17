import type { SupabaseClient } from '@supabase/supabase-js'

export async function currentUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  const id = data.session?.user.id
  if (!id) throw new Error('Sign in before changing data.')
  return id
}
