import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { getMe } from '../api/userApi'
import type { Role } from '../types/api'

interface AuthContextValue {
  isAuthenticated: boolean
  role: Role | null
  userId: number | null
  login: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'))
  const [role, setRole] = useState<Role | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setRole(null)
      setUserId(null)
      return
    }
    getMe()
      .then(({ data }) => {
        setRole(data.data.role)
        setUserId(data.data.id)
      })
      .catch(() => {})
  }, [isAuthenticated])

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsAuthenticated(false)
    setRole(null)
    setUserId(null)
  }

  // 변경(2026-09-27): React 19 — <Context.Provider> 대신 <Context value>로 바로 렌더 (이전: AuthContext.Provider)
  return (
    <AuthContext value={{ isAuthenticated, role, userId, login, logout }}>{children}</AuthContext>
  )
}

// 변경(2026-09-27): useContext → React 19 use(), Provider 밖에서 쓰면 바로 에러 (이전: null이 그대로 반환)
export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다.')
  return context
}
