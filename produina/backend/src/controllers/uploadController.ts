import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'
import { supabase } from '../config/database.js'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

const extensions: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

// The declared mimetype comes from the client, so the file signature is checked as well.
function matchesSignature(buffer: Buffer, mimetype: string) {
  if (mimetype === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mimetype === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  return false
}

export const uploadImage: RequestHandler = async (request, response) => {
  const file = request.file
  if (!file) throw new AppError('Image file is required', 400)
  if (!matchesSignature(file.buffer, file.mimetype)) throw new AppError('The file content does not match its image type', 400)
  const path = `products/${randomUUID()}.${extensions[file.mimetype]}`
  const bucket = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET)
  const { error } = await bucket.upload(path, file.buffer, { contentType: file.mimetype, cacheControl: '31536000', upsert: false })
  if (error) throw new Error(`Image upload failed: ${error.message}`)
  const { data } = bucket.getPublicUrl(path)
  response.status(201).json({ success: true, data: { url: data.publicUrl, path, mimetype: file.mimetype, size: file.size } })
}
