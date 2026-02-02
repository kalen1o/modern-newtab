import { useEffect, useState } from "react"
import { type AuthResponse, authService } from "../api/auth"

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [isRegistered, setIsRegistered] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const hasToken = authService.isAuthenticated()
                if (hasToken) {
                    const validated = await authService.validateToken()
                    setIsAuthenticated(true)
                    setIsRegistered(validated.userType === "registered")
                    setToken(authService.getToken())
                    setEmail(validated.email || authService.getUserEmail())
                } else {
                    // Automatically get guest token if no token exists
                    try {
                        await authService.getGuestToken()
                        setIsAuthenticated(true)
                        setIsRegistered(false)
                        setToken(authService.getToken())
                        setEmail(authService.getUserEmail())
                    } catch (guestErr) {
                        console.error("Failed to get guest token:", guestErr)
                        setIsAuthenticated(false)
                        setIsRegistered(false)
                        setToken(null)
                        setEmail(null)
                    }
                }
            } catch (_err) {
                authService.logout()
                setIsAuthenticated(false)
                setIsRegistered(false)
                setToken(null)
                setEmail(null)
                // Retry guest token if validation fails
                try {
                    await authService.getGuestToken()
                    setIsAuthenticated(true)
                    setIsRegistered(false)
                    setToken(authService.getToken())
                    setEmail(authService.getUserEmail())
                } catch (guestErr) {
                    console.error("Failed to get guest token:", guestErr)
                }
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
            setEmail(authService.getUserEmail())
            return response
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to get guest token"
            setError(errorMessage)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const syncAuthFromValidate = async () => {
        const validated = await authService.validateToken()
        setIsAuthenticated(true)
        setIsRegistered(validated.userType === "registered")
        setToken(authService.getToken())
        setEmail(validated.email || authService.getUserEmail())
    }

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        setLoading(true)
        setError(null)
        try {
            const response = await authService.login({ email, password })
            await syncAuthFromValidate()
            return response
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Login failed"
            setError(errorMessage)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const signup = async (email: string, password: string): Promise<AuthResponse> => {
        setLoading(true)
        setError(null)
        try {
            const response = await authService.register({ email, password })
            await syncAuthFromValidate()
            return response
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Signup failed"
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
        setEmail(null)
        setError(null)
    }

    return {
        isAuthenticated,
        isRegistered,
        loading,
        error,
        getGuestToken,
        login,
        signup,
        logout,
        token,
        email,
    }
}
