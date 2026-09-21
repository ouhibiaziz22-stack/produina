import api from './api'
import type { ApiResponse, Product } from '../types'

export const productService = {
  list: async () => (await api.get<ApiResponse<Product[]>>('/products')).data.data,
  get: async (id: string) => (await api.get<ApiResponse<Product>>(`/products/${id}`)).data.data,
}
