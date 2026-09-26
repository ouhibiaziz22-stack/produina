import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import { AppError } from '../utils/AppError.js'

export const listBac: RequestHandler = async (request, response) => {
  let query = supabase.from('bac_categories').select('*').order('name', { ascending: true })
  if (!(request.user?.role === 'admin' && request.query.includeInactive === 'true')) query = query.eq('active', true)
  const result = await query
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: result.data ?? [] })
}
export const createBac: RequestHandler = async (request, response) => {
  const result = await supabase.from('bac_categories').insert(request.body).select('*').single()
  if (result.error) throw new Error(result.error.message)
  response.status(201).json({ success: true, data: result.data })
}
export const updateBac: RequestHandler = async (request, response) => {
  const result = await supabase.from('bac_categories').update(request.body).eq('id', request.params.id).select('*').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('BAC category not found', 404)
  response.json({ success: true, data: result.data })
}
export const deleteBac: RequestHandler = async (request, response) => {
  const result = await supabase.from('bac_categories').delete().eq('id', request.params.id).select('id').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('BAC category not found', 404)
  response.status(204).send()
}
