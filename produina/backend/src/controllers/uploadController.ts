import type { RequestHandler } from 'express'
import { AppError } from '../utils/AppError.js'

export const uploadImage: RequestHandler = (request, response) => {
  if (!request.file) throw new AppError('Image file is required', 400)
  // Integrate cloud storage here; no executable files are persisted by this API.
  response.status(201).json({ success: true, data: { filename: request.file.originalname, mimetype: request.file.mimetype, size: request.file.size, url: null } })
}
