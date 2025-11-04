import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('userToken'))

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Try to get user info from token
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({
        id: payload.id,
        email: payload.email,
        role: payload.role,
        client_id: payload.client_id
      })
    }
    setLoading(false)
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('userToken', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (data) => {
    try {
      const response = await api.post('/auth/register', data)
      const { token: newToken, user: userData } = response.data
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('userToken', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('userToken')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}



