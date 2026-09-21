import { Router } from 'express'
import { createDesign, deleteDesign, getDesign, listDesigns, updateDesign } from '../controllers/designController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { designSchema } from '../validators/designValidators.js'

export const designRouter = Router()
designRouter.use(requireAuth)
designRouter.get('/', asyncHandler(listDesigns))
designRouter.get('/:id', asyncHandler(getDesign))
designRouter.post('/', validate(designSchema), asyncHandler(createDesign))
designRouter.put('/:id', validate(designSchema.partial()), asyncHandler(updateDesign))
designRouter.delete('/:id', asyncHandler(deleteDesign))
