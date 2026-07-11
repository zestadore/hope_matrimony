import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiClient, onUnauthorized, refreshAccessToken, setAccessToken } from '../api/client'

export type Role = 'super_admin' | 'admin' | 'accounts' | 'user'

export interface AuthUser {
  id: number
  name: string
  mobile_number: string
  email: string | null
  status: string
  roles: Role[]
  permissions: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (mobileNumber: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const response = await apiClient.get<{ user: AuthUser }>('/api/auth/me')
    setUser(response.data.user)
  }, [])

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    onUnauthorized(() => setUser(null))
  }, [])

  // On mount, try to silently restore the session from the httpOnly
  // refresh-token cookie (survives page reloads without re-prompting login).
  useEffect(() => {
    let cancelled = false

    void (async () => {
      const token = await refreshAccessToken()

      if (cancelled) return

      if (token) {
        try {
          await fetchMe()
        } catch {
          clearSession()
        }
      }

      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [fetchMe, clearSession])

  const login = useCallback(
    async (mobileNumber: string, password: string) => {
      const response = await apiClient.post<{ access_token: string }>('/api/auth/login', {
        mobile_number: mobileNumber,
        password,
      })
      setAccessToken(response.data.access_token)
      await fetchMe()
    },
    [fetchMe],
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout')
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
