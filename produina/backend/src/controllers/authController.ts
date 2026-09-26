import type { RequestHandler } from 'express'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/database.js'
import { AppError } from '../utils/AppError.js'
import { createToken, publicUser } from '../services/tokenService.js'
import { mapUser } from '../repositories/supabaseRepository.js'

export const register: RequestHandler = async (request, response) => {
  const email = request.body.email.trim().toLowerCase()
  const existing = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) throw new AppError('An account already exists for this email', 409)
  const password = await bcrypt.hash(request.body.password, 12)
  const result = await supabase.from('users').insert({ ...request.body, email, password }).select('*').single()
  if (result.error) throw new Error(result.error.message)
  const user = mapUser(result.data)
  response.status(201).json({ success: true, data: { user: publicUser(user), token: createToken(user) } })
}

export const login: RequestHandler = async (request, response) => {
  const result = await supabase.from('users').select('*').eq('email', request.body.email.trim().toLowerCase()).maybeSingle()
  if (result.error) throw new Error(result.error.message)
  const user = result.data ? mapUser(result.data) : null
  if (!user || !(await bcrypt.compare(request.body.password, user.password))) throw new AppError('Invalid email or password', 401)
  response.json({ success: true, data: { user: publicUser(user), token: createToken(user) } })
}

export const me: RequestHandler = async (request, response) => {
  const row = await supabase.from('users').select('*').eq('id', request.user!.id).maybeSingle()
  if (row.error) throw new Error(row.error.message)
  if (!row.data) throw new AppError('User not found', 404)
  response.json({ success: true, data: publicUser(mapUser(row.data)) })
}

export const logout: RequestHandler = (_request, response) => response.status(204).send()
