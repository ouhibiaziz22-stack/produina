import api from './api'
import type { ApiResponse, Product } from '../types'

export const productService = {
  list: async (category?: 'main' | 'bac') => (await api.get<ApiResponse<Product[]>>('/products', { params: category ? { category } : undefined })).data.data,
  get: async (id: string) => (await api.get<ApiResponse<Product>>(`/products/${id}`)).data.data,
}
