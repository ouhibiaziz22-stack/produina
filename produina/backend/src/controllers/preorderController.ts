import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import { mapProduct } from '../repositories/supabaseRepository.js'
import { AppError } from '../utils/AppError.js'
import type { PreorderInput } from '../validators/preorderValidators.js'

export const createPreorder: RequestHandler = async (request, response) => {
  const input = request.body as PreorderInput
  // Bots get the same response as people, so the honeypot is not revealed.
  if (input.website) return void response.status(201).json({ success: true, data: { received: true } })

  const row = {
    user_id: request.user?.id ?? null,
    customer_name: input.name,
    email: input.email,
    notes: input.notes || null,
    request_type: input.requestType,
  }

  if (input.requestType === 'bulk') {
    const result = await supabase.from('preorder_requests').insert({
      ...row, phone: input.phone ?? '', school: input.school || null, quantity: input.quantity,
      items: [{ product: 'BAC 2K27 capsule', quantity: input.quantity }],
    }).select('id').single()
    if (result.error) throw new Error(result.error.message)
    return void response.status(201).json({ success: true, data: { received: true, id: result.data.id } })
  }

  const ids = [...new Set(input.items.map((item) => item.productId))]
  const products = await supabase.from('products').select('*').in('id', ids).eq('active', true)
  if (products.error) throw new Error(products.error.message)
  const byId = new Map((products.data ?? []).map((product) => [String(product.id), mapProduct(product)]))

  // Prices come from the database; the browser's total is never trusted.
  const items = input.items.map((item) => {
    const product = byId.get(item.productId)
    if (!product) throw new AppError('A product in your bag is no longer available. Please refresh and try again.', 400)
    if (!product.sizes.includes(item.size)) throw new AppError(`Size ${item.size} is not available for ${product.name}.`, 400)
    if (product.category === 'bac' && !item.customization) throw new AppError(`${product.name} needs the student name, lycée and section.`, 400)
    return {
      productId: product.id, product: product.name, category: product.category, size: item.size,
      quantity: item.quantity, unitPrice: product.basePrice, lineTotal: product.basePrice * item.quantity,
      customization: item.customization ?? null,
    }
  })

  const result = await supabase.from('preorder_requests').insert({
    ...row, phone: input.phone, governorate: input.governorate, items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    estimated_total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  }).select('id').single()
  if (result.error) throw new Error(result.error.message)
  response.status(201).json({ success: true, data: { received: true, id: result.data.id } })
}

export const listPreorders: RequestHandler = async (_request, response) => {
  const result = await supabase.from('preorder_requests').select('*').order('created_at', { ascending: false }).limit(500)
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: result.data ?? [] })
}

export const updatePreorder: RequestHandler = async (request, response) => {
  const result = await supabase.from('preorder_requests').update({ status: request.body.status }).eq('id', request.params.id).select('*').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('Pre-order not found', 404)
  response.json({ success: true, data: result.data })
}
