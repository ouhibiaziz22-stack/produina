import { Router } from 'express'
import { uploadImage } from '../controllers/uploadController.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadImage as imageUpload } from '../middleware/upload.js'

export const uploadRouter = Router()
uploadRouter.post('/image', requireAuth, imageUpload.single('image'), uploadImage)
