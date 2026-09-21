import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

type JwtPayload = { sub: string; role: 'user' | 'admin' }

export const requireAuth: RequestHandler = (request, _response, next) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next(new AppError('Authentication required', 401))
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    request.user = { id: payload.sub as never, role: payload.role }
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

export const optionalAuth: RequestHandler = (request, _response, next) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next()
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    request.user = { id: payload.sub as never, role: payload.role }
  } catch {
    // Public endpoints remain public when a stale client token is sent.
  }
  next()
}

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (request.user?.role !== 'admin') return next(new AppError('Admin access required', 403))
  next()
}
