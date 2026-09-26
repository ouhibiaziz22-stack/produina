import api from './api'
import type { ApiResponse } from '../types'

export const designService = {
  save: async <T>(design: T) => (await api.post<ApiResponse<T>>('/designs', design)).data.data,
  list: async <T>() => (await api.get<ApiResponse<T[]>>('/designs')).data.data,
}
