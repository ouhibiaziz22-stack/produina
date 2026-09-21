import { Router } from 'express'
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from '../controllers/productController.js'
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { productSchema, productUpdateSchema } from '../validators/productValidators.js'

export const productRouter = Router()
productRouter.get('/', optionalAuth, asyncHandler(listProducts))
productRouter.get('/:id', optionalAuth, asyncHandler(getProduct))
productRouter.post('/', requireAuth, requireAdmin, validate(productSchema), asyncHandler(createProduct))
productRouter.put('/:id', requireAuth, requireAdmin, validate(productUpdateSchema), asyncHandler(updateProduct))
productRouter.delete('/:id', requireAuth, requireAdmin, asyncHandler(deleteProduct))
