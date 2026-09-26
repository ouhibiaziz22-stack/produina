import { Router } from 'express'
import { createPreorder, listPreorders, updatePreorder } from '../controllers/preorderController.js'
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js'
import { preorderLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { preorderSchema, preorderStatusSchema } from '../validators/preorderValidators.js'

export const preorderRouter = Router()
preorderRouter.post('/', preorderLimiter, optionalAuth, validate(preorderSchema), asyncHandler(createPreorder))
preorderRouter.get('/', requireAuth, requireAdmin, asyncHandler(listPreorders))
preorderRouter.patch('/:id', requireAuth, requireAdmin, validate(preorderStatusSchema), asyncHandler(updatePreorder))
