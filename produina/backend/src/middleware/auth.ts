import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

type JwtPayload = { sub?: unknown; role?: unknown }

function readPayload(token: string): { id: string; role: 'user' | 'admin' } {
  const payload = jwt.verify(token, env.JWT_SECRET)
  if (typeof payload !== 'object' || payload === null) throw new Error('Invalid token payload')
  const { sub, role } = payload as JwtPayload
  if (typeof sub !== 'string' || !sub || (role !== 'user' && role !== 'admin')) throw new Error('Invalid token claims')
  return { id: sub, role }
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next(new AppError('Authentication required', 401))
  try {
    request.user = readPayload(token)
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

export const optionalAuth: RequestHandler = (request, _response, next) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next()
  try {
    request.user = readPayload(token)
  } catch {
    // Public endpoints remain public when a stale client token is sent.
  }
  next()
}

export const requireAdmin: RequestHandler = (request, _response, next) => {
  if (request.user?.role !== 'admin') return next(new AppError('Admin access required', 403))
  next()
}
