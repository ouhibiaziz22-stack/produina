import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import type { OrderStatus } from '../models/Order.js'
import { AppError } from '../utils/AppError.js'
import { calculateOrderItem } from '../services/priceService.js'

export const listOrders: RequestHandler = async (request, response) => {
  let query = supabase.from('orders').select('*, users(name,email,phone)').order('created_at', { ascending: false })
  if (request.user?.role !== 'admin') query = query.eq('user_id', request.user!.id)
  const result = await query
  if (result.error) throw new Error(result.error.message)
  response.json({ success: true, data: result.data ?? [] })
}
export const getOrder: RequestHandler = async (request, response) => {
  const result = await supabase.from('orders').select('*, users(name,email,phone)').eq('id', request.params.id).maybeSingle()
  if (result.error) throw new Error(result.error.message)
  const order = result.data
  if (!order || (request.user?.role !== 'admin' && order.user_id !== request.user?.id)) throw new AppError('Order not found', 404)
  response.json({ success: true, data: order })
}
export const createOrder: RequestHandler = async (request, response) => {
  const pricedItems = await Promise.all(request.body.items.map(calculateOrderItem))
  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const extras = pricedItems.reduce((sum, item, index) => sum + item.extras * request.body.items[index].quantity, 0)
  const result = await supabase.from('orders').insert({
    user_id: request.user?.id, shipping_address: request.body.shippingAddress, governorate: request.body.governorate,
    phone: request.body.phone, payment_method: request.body.paymentMethod, subtotal, extras, total: subtotal,
    items: pricedItems.map((item, index) => ({ productId: item.product.id, name: item.product.name, configuration: item.configuration, unitPrice: item.unitPrice, quantity: request.body.items[index].quantity, lineTotal: item.lineTotal })),
  }).select('*').single()
  if (result.error) throw new Error(result.error.message)
  response.status(201).json({ success: true, data: result.data })
}
export const updateOrder: RequestHandler = async (request, response) => {
  const status = request.body.status as OrderStatus
  const valid = ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
  if (!valid.includes(status)) throw new AppError('Invalid order status', 400)
  const result = await supabase.from('orders').update({ status }).eq('id', request.params.id).select('*').maybeSingle()
  if (result.error) throw new Error(result.error.message)
  if (!result.data) throw new AppError('Order not found', 404)
  response.json({ success: true, data: result.data })
}
