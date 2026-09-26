import { Router } from 'express'
import { uploadImage } from '../controllers/uploadController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { uploadImage as imageUpload } from '../middleware/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const uploadRouter = Router()
uploadRouter.post('/image', requireAuth, requireAdmin, imageUpload.single('image'), asyncHandler(uploadImage))
