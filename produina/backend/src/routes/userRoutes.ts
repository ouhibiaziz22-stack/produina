import { Router } from 'express'
import { listUsers, updateUserRole } from '../controllers/userController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const userRouter = Router()
userRouter.use(requireAuth, requireAdmin)
userRouter.get('/', asyncHandler(listUsers))
userRouter.put('/:id/role', asyncHandler(updateUserRole))
