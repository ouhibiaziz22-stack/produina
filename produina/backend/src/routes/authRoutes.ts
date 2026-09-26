import { Router } from 'express'
import { login, logout, me, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { loginSchema, registerSchema } from '../validators/authValidators.js'

export const authRouter = Router()
authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(register))
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(login))
authRouter.get('/me', requireAuth, asyncHandler(me))
authRouter.post('/logout', requireAuth, logout)
