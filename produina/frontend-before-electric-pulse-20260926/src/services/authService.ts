import api from './api'
import type { ApiResponse, AuthPayload, AuthUser } from '../types'

type Credentials = { email: string; password: string }
type Registration = Credentials & { name: string; phone?: string; address?: string }

export function getAuthErrorMessage(cause: unknown) {
  const response = (cause as { response?: { data?: { message?: string }; status?: number } })?.response
  if (!response) return 'Le serveur est indisponible. Vérifie que l’API Produwina est démarrée, puis réessaie.'
  if (response.status === 401) return 'Email ou mot de passe incorrect.'
  if (response.status === 503) return 'La base de données est indisponible. Ajoute l’IP du serveur dans MongoDB Atlas, puis réessaie.'
  return response.data?.message || 'Impossible de se connecter. Vérifie tes informations et réessaie.'
}

export const authService = {
  login: async (payload: Credentials) => (await api.post<ApiResponse<AuthPayload>>('/auth/login', { ...payload, email: payload.email.trim().toLowerCase() })).data.data,
  register: async (payload: Registration) => (await api.post<ApiResponse<AuthPayload>>('/auth/register', { ...payload, email: payload.email.trim().toLowerCase() })).data.data,
  me: async () => (await api.get<ApiResponse<AuthUser>>('/auth/me')).data.data,
  logout: () => api.post('/auth/logout'),
}
