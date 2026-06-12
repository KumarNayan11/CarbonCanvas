import { createBrowserClient as ssrCreateBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

/**
 * Creates a Supabase client for use in the browser (Client Components).
 * Uses the public anon key — no elevated privileges.
 */
export function createBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()
  return ssrCreateBrowserClient(supabaseUrl, supabaseAnonKey)
}

