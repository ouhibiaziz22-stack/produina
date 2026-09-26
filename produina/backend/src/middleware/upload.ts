import multer from 'multer'
import { AppError } from '../utils/AppError.js'

// SVG is excluded: it can carry scripts and would be served from a public bucket.
export const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) return callback(new AppError('Only PNG, JPG and WEBP images are allowed', 400))
    callback(null, true)
  },
})
