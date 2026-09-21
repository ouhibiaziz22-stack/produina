import { Schema, model, type HydratedDocument } from 'mongoose'

export interface PriceOption { name: string; price: number }
export interface Product {
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
  createdAt: Date
  updatedAt: Date
}
export type ProductDocument = HydratedDocument<Product>

const priceOptionSchema = new Schema<PriceOption>({ name: { type: String, required: true }, price: { type: Number, min: 0, required: true } }, { _id: false })
const productSchema = new Schema<Product>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, enum: ['hoodie', 'jacket', 'tshirt', 'polo', 'oversized', 'other'], required: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  basePrice: { type: Number, required: true, min: 0 },
  colors: [{ type: String, trim: true }],
  fabrics: [priceOptionSchema], printPrices: { type: [priceOptionSchema], default: [{ name: 'DTF', price: 5 }, { name: 'Screen print', price: 5 }, { name: 'Embroidery', price: 10 }, { name: 'Vinyl', price: 7 }] }, colorZones: { type: [String], default: ['body', 'left sleeve', 'right sleeve', 'collar'] }, allowedColorModes: { type: [Number], default: [1, 2] }, model3d: { type: Schema.Types.Mixed },
  sizes: [{ type: String, trim: true }],
  images: [{ type: String, trim: true }],
  active: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false })

export const ProductModel = model<Product>('Product', productSchema)
