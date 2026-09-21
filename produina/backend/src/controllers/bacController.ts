import type { RequestHandler } from 'express'
import { BacCategoryModel } from '../models/BacCategory.js'
import { AppError } from '../utils/AppError.js'

export const listBac: RequestHandler = async (request, response) => {
  const filter = request.user?.role === 'admin' && request.query.includeInactive === 'true' ? {} : { active: true }
  response.json({ success: true, data: await BacCategoryModel.find(filter).sort({ name: 1 }) })
}
export const createBac: RequestHandler = async (request, response) => response.status(201).json({ success: true, data: await BacCategoryModel.create(request.body) })
export const updateBac: RequestHandler = async (request, response) => {
  const category = await BacCategoryModel.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true })
  if (!category) throw new AppError('BAC category not found', 404)
  response.json({ success: true, data: category })
}
export const deleteBac: RequestHandler = async (request, response) => {
  const category = await BacCategoryModel.findByIdAndDelete(request.params.id)
  if (!category) throw new AppError('BAC category not found', 404)
  response.status(204).send()
}
