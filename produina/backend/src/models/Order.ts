import { Schema, model, type Types } from 'mongoose'

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
export interface OrderItem { productId: Types.ObjectId; name: string; configuration: Record<string, unknown>; unitPrice: number; quantity: number; lineTotal: number }
export interface Order { userId: Types.ObjectId; items: OrderItem[]; shippingAddress: string; phone: string; subtotal: number; extras: number; total: number; status: OrderStatus; paymentMethod: 'cash_on_delivery' | 'online'; createdAt: Date; updatedAt: Date }
const orderItemSchema = new Schema<OrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, name: { type: String, required: true }, configuration: { type: Schema.Types.Mixed, required: true }, unitPrice: { type: Number, min: 0, required: true }, quantity: { type: Number, min: 1, required: true }, lineTotal: { type: Number, min: 0, required: true },
}, { _id: false })
const orderSchema = new Schema<Order>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, items: { type: [orderItemSchema], required: true },
  shippingAddress: { type: String, required: true, maxlength: 500 }, phone: { type: String, required: true, maxlength: 30 },
  subtotal: { type: Number, min: 0, required: true }, extras: { type: Number, min: 0, required: true }, total: { type: Number, min: 0, required: true },
  status: { type: String, enum: ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'new' }, paymentMethod: { type: String, enum: ['cash_on_delivery', 'online'], required: true },
}, { timestamps: true, versionKey: false })
export const OrderModel = model<Order>('Order', orderSchema)
