import type { RequestHandler } from 'express'
import bcrypt from 'bcryptjs'
import { UserModel } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { createToken, publicUser } from '../services/tokenService.js'

export const register: RequestHandler = async (request, response) => {
  const email = request.body.email.trim().toLowerCase()
  const exists = await UserModel.exists({ email })
  if (exists) throw new AppError('An account already exists for this email', 409)
  const password = await bcrypt.hash(request.body.password, 12)
  const user = await UserModel.create({ ...request.body, email, password })
  response.status(201).json({ success: true, data: { user: publicUser(user), token: createToken(user) } })
}

export const login: RequestHandler = async (request, response) => {
  const user = await UserModel.findOne({ email: request.body.email.trim().toLowerCase() }).select('+password')
  if (!user || !(await bcrypt.compare(request.body.password, user.password))) throw new AppError('Invalid email or password', 401)
  response.json({ success: true, data: { user: publicUser(user), token: createToken(user) } })
}

export const me: RequestHandler = async (request, response) => {
  const user = await UserModel.findById(request.user?.id)
  if (!user) throw new AppError('User not found', 404)
  response.json({ success: true, data: publicUser(user) })
}

export const logout: RequestHandler = (_request, response) => response.status(204).send()
