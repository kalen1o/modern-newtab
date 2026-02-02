import { useEffect, useState } from "react"
import { type AuthResponse, authService } from "../api/auth"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasToken = authService.isAuthenticated()
        if (hasToken) {
          await authService.validateToken()
          setIsAuthenticated(true)
          setIsRegistered(authService.isRegisteredUser())
          setToken(authService.getToken())
        }
      } catch (_err) {
        authService.logout()
        setIsAuthenticated(false)
        setIsRegistered(false)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const getGuestToken = async (): Promise<AuthResponse> => {
    setLoading(true)
    setError(null)
    try {
      const response = await authService.getGuestToken()
      setIsAuthenticated(true)
      setIsRegistered(false)
      setToken(authService.getToken())
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get guest token"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true)
    setError(null)
    try {
      const response = await authService.login({ email, password })
      setIsAuthenticated(true)
      setIsRegistered(true)
      setToken(authService.getToken())
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setIsRegistered(false)
    setToken(null)
    setError(null)
  }

  return {
    isAuthenticated,
    isRegistered,
    loading,
    error,
    getGuestToken,
    login,
    logout,
    token,
  }
}
