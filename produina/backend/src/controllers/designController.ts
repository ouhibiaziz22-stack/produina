import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import { AppError } from '../utils/AppError.js'
import { findProduct } from '../repositories/supabaseRepository.js'

export const listDesigns: RequestHandler = async (request, response) => {
  let query = supabase.from('designs').select('*').order('updated_at', { ascending: false })
  if (request.user?.role !== 'admin') query = query.eq('user_id', request.user!.id)
  const result = await query
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: result.data ?? [] })
}
export const getDesign: RequestHandler = async (request, response) => {
  const result = await supabase.from('designs').select('*').eq('id', request.params.id).maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data || (request.user?.role !== 'admin' && result.data.user_id !== request.user?.id)) throw new AppError('Design not found', 404)
  response.json({ success: true, data: result.data })
}
export const createDesign: RequestHandler = async (request, response) => {
  const product = await findProduct(request.body.productId, true)
  if (!product || !product.colors.includes(request.body.productColor) || !product.sizes.includes(request.body.size)) throw new AppError('Invalid product configuration', 400)
  const fabric = product.fabrics.find((item) => item.name === request.body.fabric)
  if (!fabric) throw new AppError('Invalid fabric selection', 400)
  const extrasPrice = request.body.extras.reduce((sum: number, extra: string) => sum + ({ flag: 12, 'mini-flag': 7, stickers: 4, keychain: 5 }[extra] ?? 0), 0)
  const result = await supabase.from('designs').insert({
    user_id: request.user!.id, bac_type: request.body.bacType, product_id: request.body.productId, product_color: request.body.productColor,
    fabric: request.body.fabric, front_design: request.body.frontDesign, back_design: request.body.backDesign, logo: request.body.logo,
    texts: request.body.texts, extras: request.body.extras, size: request.body.size, total_price: product.basePrice + fabric.price + extrasPrice,
  }).select('*').single()
  if (result.error) throw new Error(result.error.message)
  response.status(201).json({ success: true, data: result.data })
}
export const updateDesign: RequestHandler = async (request, response) => {
  const existing = await supabase.from('designs').select('user_id').eq('id', request.params.id).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (!existing.data || (request.user?.role !== 'admin' && existing.data.user_id !== request.user?.id)) throw new AppError('Design not found', 404)
  const result = await supabase.from('designs').update({
    bac_type: request.body.bacType, product_id: request.body.productId, product_color: request.body.productColor, fabric: request.body.fabric,
    front_design: request.body.frontDesign, back_design: request.body.backDesign, logo: request.body.logo, texts: request.body.texts,
    extras: request.body.extras, size: request.body.size,
  }).eq('id', request.params.id).select('*').single()
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: result.data })
}
export const deleteDesign: RequestHandler = async (request, response) => {
  const existing = await supabase.from('designs').select('user_id').eq('id', request.params.id).maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (!existing.data || (request.user?.role !== 'admin' && existing.data.user_id !== request.user?.id)) throw new AppError('Design not found', 404)
  const result = await supabase.from('designs').delete().eq('id', request.params.id)
  if (result.error) throw new Error(result.error.message)
  response.status(204).send()
}
