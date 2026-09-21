import { Router } from 'express'
import { z } from 'zod'
import { generateLogo } from '../controllers/aiController.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const aiLogoSchema = z.object({ bacSection: z.string().trim().min(2).max(100), year: z.string().trim().max(10), text: z.string().trim().max(80), concept: z.string().trim().max(300), style: z.string().trim().max(60), colors: z.array(z.string().trim().max(40)).max(6), icons: z.array(z.string().trim().max(40)).max(6), description: z.string().trim().max(500).optional() })
export const aiRouter = Router()
aiRouter.post('/logo', validate(aiLogoSchema), asyncHandler(generateLogo))
