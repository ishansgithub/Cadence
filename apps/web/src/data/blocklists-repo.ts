import { blocklistSchema, type Blocklist } from '@cadence/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { currentUserId } from './account'

const columns = 'id, user_id, name, domains, is_default, created_at, updated_at'

export type BlocklistInput = {
  name: string
  domains: string[]
  is_default?: boolean
}

export function createBlocklistsRepo(client: SupabaseClient) {
  return {
    async list(): Promise<Blocklist[]> {
      const { data, error } = await client.from('blocklists').select(columns).order('created_at', { ascending: true })
      if (error) throw error
      return blocklistSchema.array().parse(data ?? [])
    },

    async create(input: BlocklistInput): Promise<Blocklist> {
      const userId = await currentUserId(client)
      const { data, error } = await client
        .from('blocklists')
        .insert({
          user_id: userId,
          name: input.name,
          domains: input.domains,
          is_default: input.is_default ?? false,
        })
        .select(columns)
        .single()
      if (error) throw error
      return blocklistSchema.parse(data)
    },

    async update(id: string, input: BlocklistInput): Promise<Blocklist> {
      const { data, error } = await client
        .from('blocklists')
        .update({
          name: input.name,
          domains: input.domains,
          is_default: input.is_default ?? false,
        })
        .eq('id', id)
        .select(columns)
        .single()
      if (error) throw error
      return blocklistSchema.parse(data)
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from('blocklists').delete().eq('id', id)
      if (error) throw error
    },
  }
}
