import { Router } from 'express'
import { dashboard, listAdminUsers, listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/adminController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireAdmin)
adminRouter.get('/dashboard', asyncHandler(dashboard))
adminRouter.get('/users', asyncHandler(listAdminUsers))
adminRouter.get('/notifications', asyncHandler(listNotifications))
adminRouter.patch('/notifications/read-all', asyncHandler(markAllNotificationsRead))
adminRouter.patch('/notifications/:id/read', asyncHandler(markNotificationRead))
