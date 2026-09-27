import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../api/userApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('accessToken'),
  )
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)

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

  const login = (accessToken, refreshToken) => {
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
