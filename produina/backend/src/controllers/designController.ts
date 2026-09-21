import type { RequestHandler } from 'express'
import { DesignModel } from '../models/Design.js'
import { ProductModel } from '../models/Product.js'
import { AppError } from '../utils/AppError.js'

export const listDesigns: RequestHandler = async (request, response) => {
  const ownerFilter = request.user?.role === 'admin' ? {} : { userId: request.user?.id }
  response.json({ success: true, data: await DesignModel.find(ownerFilter).sort({ updatedAt: -1 }) })
}
export const getDesign: RequestHandler = async (request, response) => {
  const design = await DesignModel.findById(request.params.id)
  if (!design || (request.user?.role !== 'admin' && String(design.userId) !== String(request.user?.id))) throw new AppError('Design not found', 404)
  response.json({ success: true, data: design })
}
export const createDesign: RequestHandler = async (request, response) => {
  const product = await ProductModel.findOne({ _id: request.body.productId, active: true })
  if (!product || !product.colors.includes(request.body.productColor) || !product.sizes.includes(request.body.size)) throw new AppError('Invalid product configuration', 400)
  const fabric = product.fabrics.find((item) => item.name === request.body.fabric)
  if (!fabric) throw new AppError('Invalid fabric selection', 400)
  const extrasPrice = request.body.extras.reduce((sum: number, extra: string) => sum + ({ flag: 12, 'mini-flag': 7, stickers: 4, keychain: 5 }[extra] ?? 0), 0)
  const totalPrice = product.basePrice + fabric.price + extrasPrice
  response.status(201).json({ success: true, data: await DesignModel.create({ ...request.body, userId: request.user?.id, totalPrice }) })
}
export const updateDesign: RequestHandler = async (request, response) => {
  const design = await DesignModel.findById(request.params.id)
  if (!design || (request.user?.role !== 'admin' && String(design.userId) !== String(request.user?.id))) throw new AppError('Design not found', 404)
  Object.assign(design, request.body)
  await design.save()
  response.json({ success: true, data: design })
}
export const deleteDesign: RequestHandler = async (request, response) => {
  const design = await DesignModel.findById(request.params.id)
  if (!design || (request.user?.role !== 'admin' && String(design.userId) !== String(request.user?.id))) throw new AppError('Design not found', 404)
  await design.deleteOne()
  response.status(204).send()
}
