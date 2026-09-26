import { supabase } from '../config/database.js'
import type { Product } from '../models/Product.js'
import type { User } from '../models/User.js'

type Row = Record<string, unknown>

export function mapUser(row: Row): User {
  return {
    id: String(row.id), name: String(row.name), email: String(row.email), password: String(row.password),
    phone: row.phone ? String(row.phone) : undefined, role: row.role === 'admin' ? 'admin' : 'user',
    address: row.address ? String(row.address) : undefined, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}

export function mapProduct(row: Row): Product {
  return {
    id: String(row.id), category: row.category === 'bac' ? 'bac' : 'main', name: String(row.name),
    type: row.type as Product['type'], description: String(row.description), basePrice: Number(row.base_price),
    stock: Number(row.stock ?? 0),
    colors: (row.colors as string[]) ?? [], fabrics: (row.fabrics as Product['fabrics']) ?? [],
    printPrices: (row.print_prices as Product['printPrices']) ?? [], colorZones: (row.color_zones as string[]) ?? [],
    allowedColorModes: (row.allowed_color_modes as number[]) ?? [], model3d: row.model3d as Product['model3d'],
    sizes: (row.sizes as string[]) ?? [], images: (row.images as string[]) ?? [], active: Boolean(row.active),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}

export async function findProduct(id: string, activeOnly = false) {
  let query = supabase.from('products').select('*').eq('id', id)
  if (activeOnly) query = query.eq('active', true)
  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapProduct(data as Row) : null
}

export async function findUserById(id: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? mapUser(data as Row) : null
}
