import { Schema, model, type HydratedDocument } from 'mongoose'

export type UserRole = 'user' | 'admin'
export interface User {
  name: string
  email: string
  phone?: string
  password: string
  role: UserRole
  address?: string
  createdAt: Date
  updatedAt: Date
}
export type UserDocument = HydratedDocument<User>

const userSchema = new Schema<User>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true, maxlength: 30 },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  address: { type: String, trim: true, maxlength: 300 },
}, { timestamps: true, versionKey: false })

export const UserModel = model<User>('User', userSchema)
