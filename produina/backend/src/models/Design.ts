export interface Design {
  id: string
  userId: string
  bacType: string
  productId: string
  productColor: string
  fabric: string
  frontDesign?: Record<string, unknown>
  backDesign?: Record<string, unknown>
  logo?: Record<string, unknown>
  texts: Record<string, unknown>[]
  extras: string[]
  size: string
  totalPrice: number
  createdAt: string
  updatedAt: string
}
