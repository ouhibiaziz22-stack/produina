import { Schema, model, type Types } from 'mongoose'

export interface Design {
  userId: Types.ObjectId
  bacType: string
  productId: Types.ObjectId
  productColor: string
  fabric: string
  frontDesign?: Record<string, unknown>
  backDesign?: Record<string, unknown>
  logo?: Record<string, unknown>
  texts: Record<string, unknown>[]
  extras: string[]
  size: string
  totalPrice: number
  createdAt: Date
  updatedAt: Date
}
const designSchema = new Schema<Design>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bacType: { type: String, required: true, trim: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productColor: { type: String, required: true, trim: true },
  fabric: { type: String, required: true, trim: true },
  frontDesign: { type: Schema.Types.Mixed }, backDesign: { type: Schema.Types.Mixed }, logo: { type: Schema.Types.Mixed },
  texts: [{ type: Schema.Types.Mixed }], extras: [{ type: String }], size: { type: String, required: true },
  totalPrice: { type: Number, required: true, min: 0 },
}, { timestamps: true, versionKey: false })
export const DesignModel = model<Design>('Design', designSchema)
