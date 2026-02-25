import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, getTokenPayload, type UserProfile } from '../api'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (nombre: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const profile = getTokenPayload()
    setUser(profile)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(getTokenPayload())
  }

  const register = async (nombre: string, email: string, password: string) => {
    await api.auth.register({ nombre, email, password })
    // auto-login after registration
    await login(email, password)
  }

  const logout = async () => {
    try { await api.auth.logout() } catch { /* best effort */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
