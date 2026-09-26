export type UserRole = 'user' | 'admin'
export interface User {
  name: string
  email: string
  phone?: string
  password: string
  role: UserRole
  address?: string
  id: string
  createdAt: string
  updatedAt: string
}
