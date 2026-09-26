import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, supabaseSecretKey } from './env.js'

export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function connectDatabase() {
  const { error } = await supabase.from('products').select('id').limit(1)
  if (error) throw new Error(`Supabase connection failed: ${error.message}`)
  console.info(`Supabase connected: ${new URL(env.SUPABASE_URL).host}`)
}
