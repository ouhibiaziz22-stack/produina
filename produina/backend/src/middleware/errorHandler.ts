import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/AppError.js'

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ success: false, message: 'Route not found' })
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next
  if (error instanceof ZodError) {
    response.status(400).json({ success: false, message: 'Invalid request data', errors: error.flatten() })
    return
  }
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ success: false, message: error.message })
    return
  }
  if (error instanceof Error && error.name === 'CastError') {
    response.status(400).json({ success: false, message: 'Invalid resource id' })
    return
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: number | string }).code
    if (code === '22P02') {
      response.status(400).json({ success: false, message: 'Invalid resource id' })
      return
    }
    if (code === '23505' || code === 11000) {
      response.status(409).json({ success: false, message: 'An account already exists for this email' })
      return
    }
  }
  console.error(error)
  response.status(500).json({ success: false, message: 'Internal server error' })
}
