import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch {
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
    }
  }, [])

  useEffect(() => {
    if (token) {
      api.getProfile()
        .then((profile) => {
          setUser(profile)
          setLoading(false)
        })
        .catch(() => {
          setUser(null)
          setToken(null)
          localStorage.removeItem('token')
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    localStorage.setItem('token', result.token)
    setToken(result.token)
    setUser(result.user)
  }

  const register = async (data: { name: string; email: string; phone: string; password: string }) => {
    const result = await api.register(data)
    localStorage.setItem('token', result.token)
    setToken(result.token)
    setUser(result.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
