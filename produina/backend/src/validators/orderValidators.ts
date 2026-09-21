import { z } from 'zod'

export const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(25), fabric: z.string().trim().min(1), color: z.string().trim().min(1), size: z.string().trim().min(1), frontPrint: z.boolean().default(false), backPrint: z.boolean().default(false), printMethod: z.enum(['DTF', 'Screen print', 'Embroidery', 'Vinyl']).default('DTF'), placement: z.string().trim().max(50).default('Center chest'), extras: z.array(z.enum(['flag', 'mini-flag', 'stickers', 'keychain'])).default([]), frontDesign: z.record(z.string(), z.unknown()).optional(), backDesign: z.record(z.string(), z.unknown()).optional() })).min(1).max(20),
  shippingAddress: z.string().trim().min(10).max(500), phone: z.string().trim().min(6).max(30), paymentMethod: z.enum(['cash_on_delivery', 'online']),
})
