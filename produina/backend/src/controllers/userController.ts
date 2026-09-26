import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import { AppError } from '../utils/AppError.js'
import { mapUser } from '../repositories/supabaseRepository.js'
import { publicUser } from '../services/tokenService.js'

export const listUsers: RequestHandler = async (_request, response) => {
  const result = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: (result.data ?? []).map((row) => publicUser(mapUser(row))) })
}
export const updateUserRole: RequestHandler = async (request, response) => {
  if (!['user', 'admin'].includes(request.body.role)) throw new AppError('Invalid user role', 400)
  const result = await supabase.from('users').update({ role: request.body.role }).eq('id', request.params.id).select('*').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('User not found', 404)
  response.json({ success: true, data: publicUser(mapUser(result.data)) })
}
