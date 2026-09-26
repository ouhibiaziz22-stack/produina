import { z } from 'zod'

export const designSchema = z.object({
  bacType: z.string().trim().min(2).max(100), productId: z.string().uuid(), productColor: z.string().trim().min(1), fabric: z.string().trim().min(1), frontDesign: z.record(z.string(), z.unknown()).optional(), backDesign: z.record(z.string(), z.unknown()).optional(), logo: z.record(z.string(), z.unknown()).optional(), texts: z.array(z.record(z.string(), z.unknown())).default([]), extras: z.array(z.string()).default([]), size: z.string().trim().min(1),
})
