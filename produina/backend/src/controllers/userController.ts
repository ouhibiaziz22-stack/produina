import type { RequestHandler } from 'express'
import { UserModel } from '../models/User.js'
import { AppError } from '../utils/AppError.js'

export const listUsers: RequestHandler = async (_request, response) => response.json({ success: true, data: await UserModel.find().select('-password').sort({ createdAt: -1 }) })
export const updateUserRole: RequestHandler = async (request, response) => {
  if (!['user', 'admin'].includes(request.body.role)) throw new AppError('Invalid user role', 400)
  const user = await UserModel.findByIdAndUpdate(request.params.id, { role: request.body.role }, { new: true }).select('-password')
  if (!user) throw new AppError('User not found', 404)
  response.json({ success: true, data: user })
}
