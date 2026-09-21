import type { RequestHandler } from 'express'
import { OrderModel, type OrderStatus } from '../models/Order.js'
import { AppError } from '../utils/AppError.js'
import { calculateOrderItem } from '../services/priceService.js'

export const listOrders: RequestHandler = async (request, response) => {
  const filter = request.user?.role === 'admin' ? {} : { userId: request.user?.id }
  response.json({ success: true, data: await OrderModel.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email phone') })
}
export const getOrder: RequestHandler = async (request, response) => {
  const order = await OrderModel.findById(request.params.id).populate('userId', 'name email phone')
  if (!order || (request.user?.role !== 'admin' && String(order.userId) !== String(request.user?.id))) throw new AppError('Order not found', 404)
  response.json({ success: true, data: order })
}
export const createOrder: RequestHandler = async (request, response) => {
  const pricedItems = await Promise.all(request.body.items.map(calculateOrderItem))
  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const extras = pricedItems.reduce((sum, item) => sum + item.extras * request.body.items.find((input: { productId: string }) => input.productId === item.product.id)!.quantity, 0)
  const order = await OrderModel.create({
    userId: request.user?.id,
    shippingAddress: request.body.shippingAddress,
    phone: request.body.phone,
    paymentMethod: request.body.paymentMethod,
    subtotal,
    extras,
    total: subtotal,
    items: pricedItems.map((item, index) => ({ productId: item.product.id, name: item.product.name, configuration: item.configuration, unitPrice: item.unitPrice, quantity: request.body.items[index].quantity, lineTotal: item.lineTotal })),
  })
  response.status(201).json({ success: true, data: order })
}
export const updateOrder: RequestHandler = async (request, response) => {
  const status = request.body.status as OrderStatus
  const valid = ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
  if (!valid.includes(status)) throw new AppError('Invalid order status', 400)
  const order = await OrderModel.findByIdAndUpdate(request.params.id, { status }, { new: true })
  if (!order) throw new AppError('Order not found', 404)
  response.json({ success: true, data: order })
}
