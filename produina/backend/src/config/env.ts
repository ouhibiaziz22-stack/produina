import 'dotenv/config'
import { z } from 'zod'

const origins = z.string().transform((value, context) => {
  const list = value.split(',').map((item) => item.trim().replace(/\/$/, '')).filter(Boolean)
  for (const origin of list) {
    if (!z.string().url().safeParse(origin).success) context.addIssue({ code: z.ZodIssueCode.custom, message: `FRONTEND_URL contains an invalid URL: ${origin}` })
  }
  return list
})

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().trim().min(1).default('product-images'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must have at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Comma-separated list, e.g. "https://azix.tn,https://www.azix.tn"
  FRONTEND_URL: origins.default('http://localhost:8080'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().trim().min(2).max(100).default('Prodwina Admin'),
  FEATURE_BAC: z.enum(['true', 'false']).default('true'),
}).superRefine((values, context) => {
  if (!values.SUPABASE_SECRET_KEY && !values.SUPABASE_SERVICE_ROLE_KEY) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['SUPABASE_SECRET_KEY'], message: 'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required' })
  }
})

export const env = schema.parse(process.env)
export const supabaseSecretKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY!
export const isProduction = env.NODE_ENV === 'production'
