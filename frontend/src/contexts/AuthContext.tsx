import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        return JSON.parse(stored) as User
      } catch {
        return null
      }
    }
    return null
  })

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser) as User)
      } catch {
        logout()
      }
    }
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      logout,
    }),
    [user, token, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
