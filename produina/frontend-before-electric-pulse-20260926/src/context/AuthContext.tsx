import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services/authService'
import type { AuthPayload, AuthUser } from '../types'

type AuthContextValue = { user: AuthUser | null; authenticate: (payload: AuthPayload) => void; logout: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('produiwina_user')
    if (!stored) return null
    try { return JSON.parse(stored) as AuthUser } catch { localStorage.removeItem('produiwina_user'); localStorage.removeItem('produiwina_token'); return null }
  })
  const authenticate = (payload: AuthPayload) => { localStorage.setItem('produiwina_token', payload.token); localStorage.setItem('produiwina_user', JSON.stringify(payload.user)); setUser(payload.user) }
  const logout = async () => { try { await authService.logout() } finally { localStorage.removeItem('produiwina_token'); localStorage.removeItem('produiwina_user'); setUser(null) } }
  const value = useMemo(() => ({ user, authenticate, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context }
