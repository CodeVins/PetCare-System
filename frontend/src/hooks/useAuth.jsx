import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('accessToken'),
  )

  const login = (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
