import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

// The anon key is safe to ship to the client by design — Supabase's actual
// security boundary is Row Level Security policies on the database, not
// this key. Real secrets (service role key) must never go in VITE_ vars.
export const supabase = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null
