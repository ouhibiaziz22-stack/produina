import { Router } from 'express'
import { createOrder, getOrder, listOrders, updateOrder } from '../controllers/orderController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { orderSchema } from '../validators/orderValidators.js'

export const orderRouter = Router()
orderRouter.use(requireAuth)
orderRouter.get('/', asyncHandler(listOrders))
orderRouter.get('/:id', asyncHandler(getOrder))
orderRouter.post('/', validate(orderSchema), asyncHandler(createOrder))
orderRouter.put('/:id', requireAdmin, asyncHandler(updateOrder))
