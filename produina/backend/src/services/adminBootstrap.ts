import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { supabase } from '../config/database.js'

export async function ensureAdminAccount() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return
  const email = env.ADMIN_EMAIL.trim().toLowerCase()
  const existing = await supabase.from('users').select('id,role').eq('email', email).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) {
    if (existing.data.role !== 'admin') {
      const result = await supabase.from('users').update({ role: 'admin' }).eq('id', existing.data.id)
      if (result.error) throw new Error(result.error.message)
    }
    return
  }
  const password = await bcrypt.hash(env.ADMIN_PASSWORD, 12)
  const result = await supabase.from('users').insert({ name: env.ADMIN_NAME, email, password, role: 'admin' })
  if (result.error) throw new Error(result.error.message)
  console.info('Initial administrator account is ready.')
}
