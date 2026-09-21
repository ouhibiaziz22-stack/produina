import { z } from 'zod'

const password = z.string().min(8, 'Password must have at least 8 characters').max(128)
export const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email(), phone: z.string().trim().max(30).optional(), password, address: z.string().trim().max(300).optional() })
export const loginSchema = z.object({ email: z.string().trim().email(), password })
