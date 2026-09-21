import { ProductModel } from '../models/Product.js'
import { AppError } from '../utils/AppError.js'

const extrasPrices: Record<string, number> = { flag: 12, 'mini-flag': 7, stickers: 4, keychain: 5 }
type PriceInput = { productId: string; quantity: number; fabric: string; color: string; size: string; frontPrint: boolean; backPrint: boolean; printMethod?: 'DTF' | 'Screen print' | 'Embroidery' | 'Vinyl'; placement?: string; extras: string[]; frontDesign?: Record<string, unknown>; backDesign?: Record<string, unknown> }

export async function calculateOrderItem(input: PriceInput) {
  const product = await ProductModel.findOne({ _id: input.productId, active: true })
  if (!product) throw new AppError('Product not found or unavailable', 404)
  if (!product.colors.includes(input.color)) throw new AppError('Selected color is not available for this product', 400)
  if (!product.sizes.includes(input.size)) throw new AppError('Selected size is not available for this product', 400)
  const fabric = product.fabrics.find((option) => option.name === input.fabric)
  if (!fabric) throw new AppError('Selected fabric is not available for this product', 400)
  const extras = input.extras.reduce((sum, extra) => sum + (extrasPrices[extra] ?? 0), 0)
  const methodPrice = product.printPrices.find((option) => option.name === (input.printMethod ?? 'DTF'))?.price ?? 5
  const unitPrice = product.basePrice + fabric.price + (input.frontPrint ? methodPrice : 0) + (input.backPrint ? 7 : 0) + extras
  return { product, unitPrice, extras, lineTotal: unitPrice * input.quantity, configuration: { fabric: input.fabric, color: input.color, size: input.size, frontPrint: input.frontPrint, backPrint: input.backPrint, printMethod: input.printMethod ?? 'DTF', placement: input.placement ?? 'Center chest', extras: input.extras, frontDesign: input.frontDesign, backDesign: input.backDesign, aiLogoPrice: 0 } }
}
