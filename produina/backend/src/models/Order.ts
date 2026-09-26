export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
export interface OrderItem { productId: string; name: string; configuration: Record<string, unknown>; unitPrice: number; quantity: number; lineTotal: number }
export interface Order { id: string; userId: string; items: OrderItem[]; shippingAddress: string; governorate: string; phone: string; subtotal: number; extras: number; total: number; status: OrderStatus; paymentMethod: 'cash_on_delivery' | 'online'; createdAt: string; updatedAt: string }
