import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  name: string
  role: string
  balance: number
  isActive: boolean
  code: string
  contactno: string
}

interface AuthState {
  user: User | null
  loading: boolean
  authenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false
  })

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        setAuthState({
          user: null,
          loading: false,
          authenticated: false
        })
        return
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true
        })
      } else {
        // Token is invalid, clear localStorage
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        setAuthState({
          user: null,
          loading: false,
          authenticated: false
        })
      }
    } catch (error) {
      console.error('Session check error:', error)
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      setAuthState({
        user: null,
        loading: false,
        authenticated: false
      })
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()
      
      // Store authentication token
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userData', JSON.stringify(data.user))

      // Update auth state immediately
      setAuthState({
        user: data.user,
        loading: false,
        authenticated: true
      })

      return { success: true, user: data.user }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setAuthState({
      user: null,
      loading: false,
      authenticated: false
    })
  }

  useEffect(() => {
    checkSession()
  }, [])

  return {
    ...authState,
    login,
    logout,
    checkSession
  }
} 