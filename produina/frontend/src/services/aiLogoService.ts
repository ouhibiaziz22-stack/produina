import api from './api'
import type { AiLogoConcept, AiLogoRequest, ApiResponse } from '../types'

export const aiLogoService = {
  generate: async (request: AiLogoRequest) => (await api.post<ApiResponse<{ concepts: AiLogoConcept[]; price: 0 }>>('/ai/logo', request)).data.data,
}
