import type { RequestHandler } from 'express'
import { ProductModel } from '../models/Product.js'
import { AppError } from '../utils/AppError.js'

export const listProducts: RequestHandler = async (request, response) => {
  const filter = request.user?.role === 'admin' && request.query.includeInactive === 'true' ? {} : { active: true }
  response.json({ success: true, data: await ProductModel.find(filter).sort({ createdAt: -1 }) })
}
export const getProduct: RequestHandler = async (request, response) => {
  const product = await ProductModel.findById(request.params.id)
  if (!product || (!product.active && request.user?.role !== 'admin')) throw new AppError('Product not found', 404)
  response.json({ success: true, data: product })
}
export const createProduct: RequestHandler = async (request, response) => response.status(201).json({ success: true, data: await ProductModel.create(request.body) })
export const updateProduct: RequestHandler = async (request, response) => {
  const product = await ProductModel.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true })
  if (!product) throw new AppError('Product not found', 404)
  response.json({ success: true, data: product })
}
export const deleteProduct: RequestHandler = async (request, response) => {
  const product = await ProductModel.findByIdAndDelete(request.params.id)
  if (!product) throw new AppError('Product not found', 404)
  response.status(204).send()
}
