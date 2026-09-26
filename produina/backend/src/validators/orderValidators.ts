import { z } from 'zod'

export const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(25), fabric: z.string().trim().min(1), color: z.string().trim().min(1), size: z.string().trim().min(1), frontPrint: z.boolean().default(false), backPrint: z.boolean().default(false), printMethod: z.enum(['DTF', 'Screen print', 'Embroidery', 'Vinyl']).default('DTF'), placement: z.string().trim().max(50).default('Center chest'), extras: z.array(z.enum(['flag', 'mini-flag', 'stickers', 'keychain'])).default([]), frontDesign: z.record(z.string(), z.unknown()).optional(), backDesign: z.record(z.string(), z.unknown()).optional(), customization: z.object({ studentName: z.string().trim().min(2).max(100), lycee: z.string().trim().min(2).max(150), section: z.enum(['Math', 'Sciences', 'Technique', 'Info', 'Éco-Gestion', 'Lettres', 'Sport']) }).optional() })).min(1).max(20),
  shippingAddress: z.string().trim().min(10).max(500), governorate: z.string().trim().min(2).max(60), phone: z.string().trim().regex(/^\+216\s?[2-9]\d\s?\d{3}\s?\d{3}$/, 'Use a Tunisian phone number such as +216 20 123 456'), // Online payment is not integrated yet, so only cash on delivery is accepted.
  paymentMethod: z.literal('cash_on_delivery').default('cash_on_delivery'),
})
