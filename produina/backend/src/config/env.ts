import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL').optional(),
  SUPABASE_SECRET_KEY: z.string().min(1, 'SUPABASE_SECRET_KEY is required').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must have at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
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
