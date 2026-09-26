import api from './api'
import type { ApiResponse, Product, UserRole } from '../types'

export type AdminRecord = { _id?: string; id?: string; createdAt?: string; updatedAt?: string }
export type AdminUser = AdminRecord & { name: string; email: string; phone?: string; role: UserRole; address?: string }
export type AdminOrder = AdminRecord & { userId?: { name?: string; email?: string; phone?: string } | string; items: Array<{ name: string; quantity: number; lineTotal: number; configuration?: { category?: string; customization?: { studentName?: string; lycee?: string; section?: string } } }>; total: number; status: string; paymentMethod: string; phone: string; governorate?: string; shippingAddress: string }
export type AdminDesign = AdminRecord & { userId?: string; bacType: string; productId?: string; productColor: string; fabric: string; size: string; totalPrice: number; extras: string[] }
export type AdminBac = AdminRecord & { name: string; description?: string; active: boolean }
export type ProductInput = Omit<Partial<Product>, 'basePrice'> & { name: string; type: Product['type']; description: string; basePrice: number; colors: string[]; fabrics: Array<{ name: string; price: number }>; sizes: string[] }

async function get<T>(url: string) {
  return (await api.get<ApiResponse<T>>(url)).data.data
}

export const adminService = {
  dashboard: async () => {
    const [products, orders, users, designs, bac] = await Promise.all([
      get<Product[]>('/products?includeInactive=true'),
      get<AdminOrder[]>('/orders'),
      get<AdminUser[]>('/users'),
      get<AdminDesign[]>('/designs'),
      get<AdminBac[]>('/bac?includeInactive=true'),
    ])
    return { products, orders, users, designs, bac }
  },
  createProduct: async (payload: ProductInput) => (await api.post<ApiResponse<Product>>('/products', payload)).data.data,
  updateProduct: async (id: string, payload: Partial<ProductInput>) => (await api.put<ApiResponse<Product>>(`/products/${id}`, payload)).data.data,
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  updateOrder: async (id: string, status: string) => (await api.put<ApiResponse<AdminOrder>>(`/orders/${id}`, { status })).data.data,
  updateUserRole: async (id: string, role: UserRole) => (await api.put<ApiResponse<AdminUser>>(`/users/${id}/role`, { role })).data.data,
  createBac: async (payload: Pick<AdminBac, 'name' | 'description' | 'active'>) => (await api.post<ApiResponse<AdminBac>>('/bac', payload)).data.data,
  updateBac: async (id: string, payload: Partial<Pick<AdminBac, 'name' | 'description' | 'active'>>) => (await api.put<ApiResponse<AdminBac>>(`/bac/${id}`, payload)).data.data,
  deleteBac: (id: string) => api.delete(`/bac/${id}`),
  deleteDesign: (id: string) => api.delete(`/designs/${id}`),
}
