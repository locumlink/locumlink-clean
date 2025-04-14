import { createClient } from '@supabase/supabase-js'

let supabase = null

if (typeof window !== 'undefined') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
