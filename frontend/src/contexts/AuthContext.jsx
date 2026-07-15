import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        setUser({
          id: response.data.userId,
          username: response.data.username,
          email: response.data.email,
        })
      } catch {
        const decoded = parseJwt(token)
        if (decoded?.id) {
          setUser({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
          })
        } else {
          localStorage.removeItem('token')
        }
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, userId, username, email: userEmail } = response.data
    localStorage.setItem('token', token)
    setUser({ id: userId, username, email: userEmail })
    return response.data
  }

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password })
    const { token, userId, username: userName, email: userEmail } = response.data
    localStorage.setItem('token', token)
    setUser({ id: userId, username: userName, email: userEmail })
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
