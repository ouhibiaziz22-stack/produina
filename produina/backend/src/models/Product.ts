export interface PriceOption { name: string; price: number }
export interface Product {
  category: 'main' | 'bac'
  name: string
  type: 'hoodie' | 'jacket' | 'tshirt' | 'polo' | 'oversized' | 'other'
  description: string
  basePrice: number
  colors: string[]
  fabrics: PriceOption[]
  printPrices: PriceOption[]
  colorZones: string[]
  allowedColorModes: number[]
  model3d?: { url?: string; camera?: Record<string, unknown>; materials?: Record<string, unknown> }
  sizes: string[]
  images: string[]
  active: boolean
  id: string
  createdAt: string
  updatedAt: string
}
