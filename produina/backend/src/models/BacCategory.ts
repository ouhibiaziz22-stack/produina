import { Schema, model } from 'mongoose'

export interface BacCategory { name: string; description?: string; image?: string; active: boolean }
const bacCategorySchema = new Schema<BacCategory>({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  image: { type: String, trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false })
export const BacCategoryModel = model<BacCategory>('BacCategory', bacCategorySchema)
