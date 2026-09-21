import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) return callback(new AppError('Only PNG, JPG, WEBP and SVG images are allowed', 400))
    callback(null, true)
  },
})
