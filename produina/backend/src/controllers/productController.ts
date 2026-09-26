import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import { AppError } from '../utils/AppError.js'
import { mapProduct } from '../repositories/supabaseRepository.js'

const toRow = (input: Record<string, unknown>) => ({
  category: input.category, name: input.name, type: input.type, description: input.description, base_price: input.basePrice,
  colors: input.colors, fabrics: input.fabrics, print_prices: input.printPrices, color_zones: input.colorZones,
  allowed_color_modes: input.allowedColorModes, model3d: input.model3d, sizes: input.sizes, images: input.images, active: input.active,
})

export const listProducts: RequestHandler = async (request, response) => {
  const includeInactive = request.user?.role === 'admin' && request.query.includeInactive === 'true'
  let query = supabase.from('products').select('*').order('created_at', { ascending: false })
  if (!includeInactive) query = query.eq('active', true)
  if (request.query.category === 'main' || request.query.category === 'bac') query = query.eq('category', request.query.category)
  const result = await query
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: (result.data ?? []).map(mapProduct) })
}
export const getProduct: RequestHandler = async (request, response) => {
  const product = await (async () => {
    const result = await supabase.from('products').select('*').eq('id', request.params.id).maybeSingle()
    if (result.error) throw new Error(result.error.message)
    return result.data ? mapProduct(result.data) : null
  })()
  const category = request.query.category
  if (!product || (category && product.category !== category) || (!product.active && request.user?.role !== 'admin')) throw new AppError('Product not found', 404)
  response.json({ success: true, data: product })
}
export const createProduct: RequestHandler = async (request, response) => {
  const result = await supabase.from('products').insert(toRow(request.body)).select('*').single()
  if (result.error) throw new Error(result.error.message)
  response.status(201).json({ success: true, data: mapProduct(result.data) })
}
export const updateProduct: RequestHandler = async (request, response) => {
  const result = await supabase.from('products').update(toRow(request.body)).eq('id', request.params.id).select('*').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('Product not found', 404)
  response.json({ success: true, data: mapProduct(result.data) })
}
export const deleteProduct: RequestHandler = async (request, response) => {
  const result = await supabase.from('products').delete().eq('id', request.params.id).select('id').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('Product not found', 404)
  response.status(204).send()
}
