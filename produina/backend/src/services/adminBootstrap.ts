import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { UserModel } from '../models/User.js'

/** Creates the first administrator without ever persisting the bootstrap password in plain text. */
export async function ensureAdminAccount() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return

  const email = env.ADMIN_EMAIL.trim().toLowerCase()
  const existing = await UserModel.findOne({ email }).select('+password')
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin'
      await existing.save()
    }
    return
  }

  const password = await bcrypt.hash(env.ADMIN_PASSWORD, 12)
  await UserModel.create({ name: env.ADMIN_NAME, email, password, role: 'admin' })
  console.info('Initial administrator account is ready.')
}
