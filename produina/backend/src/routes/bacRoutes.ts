import { Router } from 'express'
import { createBac, deleteBac, listBac, updateBac } from '../controllers/bacController.js'
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { bacSchema } from '../validators/productValidators.js'

export const bacRouter = Router()
bacRouter.get('/', optionalAuth, asyncHandler(listBac))
bacRouter.post('/', requireAuth, requireAdmin, validate(bacSchema), asyncHandler(createBac))
bacRouter.put('/:id', requireAuth, requireAdmin, validate(bacSchema.partial()), asyncHandler(updateBac))
bacRouter.delete('/:id', requireAuth, requireAdmin, asyncHandler(deleteBac))
