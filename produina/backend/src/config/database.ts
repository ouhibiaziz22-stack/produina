import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 })
  console.info(`MongoDB connected: ${mongoose.connection.host}`)
}
