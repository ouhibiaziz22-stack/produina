import jwt from 'jsonwebtoken'
import type { User } from '../models/User.js'
import { env } from '../config/env.js'

export const createToken = (user: User) => jwt.sign(
  { role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
)
export const publicUser = (user: User) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, address: user.address, createdAt: user.createdAt })
