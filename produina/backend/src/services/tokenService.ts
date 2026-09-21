import jwt from 'jsonwebtoken'
import type { UserDocument } from '../models/User.js'
import { env } from '../config/env.js'

export const createToken = (user: UserDocument) => jwt.sign(
  { role: user.role },
  env.JWT_SECRET,
  { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
)
export const publicUser = (user: UserDocument) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, address: user.address, createdAt: user.createdAt })
