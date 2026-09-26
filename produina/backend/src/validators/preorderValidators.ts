import { z } from 'zod'

export const bacSections = ['Math', 'Sciences', 'Technique', 'Info', 'Éco-Gestion', 'Lettres', 'Sport'] as const
export const preorderStatuses = ['new', 'contacted', 'confirmed', 'converted', 'cancelled'] as const

const contact = {
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  notes: z.string().trim().max(2000).optional(),
  // Honeypot: hidden in the form, so only bots fill it in.
  website: z.string().max(500).optional(),
}

const preorder = z.object({
  ...contact,
  requestType: z.literal('preorder'),
  phone: z.string().trim().regex(/^\+216\s?[2-9]\d\s?\d{3}\s?\d{3}$/, 'Use a Tunisian phone number such as +216 20 123 456'),
  governorate: z.string().trim().min(2).max(60),
  items: z.array(z.object({
    productId: z.string().uuid(),
    size: z.string().trim().min(1).max(20),
    quantity: z.number().int().min(1).max(25),
    customization: z.object({
      studentName: z.string().trim().min(2).max(100),
      lycee: z.string().trim().min(2).max(150),
      section: z.enum(bacSections),
    }).optional(),
  })).min(1).max(20),
})

const bulk = z.object({
  ...contact,
  requestType: z.literal('bulk'),
  phone: z.string().trim().max(30).optional(),
  school: z.string().trim().max(150).optional(),
  quantity: z.number().int().min(1).max(10000),
})

export const preorderSchema = z.discriminatedUnion('requestType', [preorder, bulk])
export type PreorderInput = z.infer<typeof preorderSchema>
export const preorderStatusSchema = z.object({ status: z.enum(preorderStatuses) })
