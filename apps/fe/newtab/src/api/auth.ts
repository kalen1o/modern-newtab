import { api } from "./client"

export interface AuthResponse {
    token: string
    refreshToken: string
    type: string
    userType: "guest" | "registered"
    email?: string
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    email: string
    password: string
}

export interface RefreshRequest {
    refreshToken: string
}

export interface TokenRefreshError {
    message: string
    shouldRetry: boolean
}

class AuthService {
    private tokenKey = "authToken"
    private refreshTokenKey = "refreshToken"
    private userTypeKey = "userType"
    private userEmailKey = "userEmail"
    private isRefreshing = false
    private refreshSubscribers: ((token: string) => void)[] = []
    private refreshPromise: Promise<AuthResponse> | null = null

    onTokenRefresh(callback: (newToken: string) => void): () => void {
        this.refreshSubscribers.push(callback)
        return () => {
            this.refreshSubscribers = this.refreshSubscribers.filter(cb => cb !== callback)
        }
    }

    private checkAndRefreshTokenIfNeeded(token: string): void {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const exp = payload.exp * 1000
            const now = Date.now()
            const timeUntilExpiry = exp - now

            if (timeUntilExpiry < 30000 && !this.isRefreshing) {
                console.log("Token expiring soon, proactively refreshing...")
                void this.doProactiveRefresh()
            }
        } catch (e) {
            console.error("Error checking token expiry:", e)
        }
    }

    private async doProactiveRefresh(): Promise<void> {
        if (this.isRefreshing) return
        this.isRefreshing = true
        try {
            const newTokens = await this.refreshToken()
            this.refreshSubscribers.forEach(cb => { cb(newTokens.token) })
        } catch (error) {
            console.error("Failed to refresh token:", error)
        } finally {
            this.isRefreshing = false
        }
    }

    private async refreshTokenOrWait(): Promise<AuthResponse> {
        if (this.refreshPromise) {
            return this.refreshPromise
        }
        this.refreshPromise = this.refreshToken()
        try {
            const result = await this.refreshPromise
            return result
        } finally {
            this.refreshPromise = null
        }
    }

    async getGuestToken(): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/guest")
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        this.checkAndRefreshTokenIfNeeded(response.token)
        return response
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/login", credentials)
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        this.checkAndRefreshTokenIfNeeded(response.token)
        return response
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/register", data)
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        this.checkAndRefreshTokenIfNeeded(response.token)
        return response
    }

    async refreshToken(): Promise<AuthResponse> {
        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
            throw new Error("No refresh token available")
        }
        const response = await api.post<AuthResponse>("/api/auth/refresh", { refreshToken })
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        return response
    }

    async validateToken(): Promise<{ email: string; userType: string }> {
        const token = this.getToken()
        if (!token) {
            throw new Error("No token available")
        }

        try {
            const response = await api.get<{ email: string; userType: string }>("/api/auth/validate")
            const userType = response.userType === "registered" ? "registered" : "guest"
            this.saveToken(token, this.getRefreshToken() ?? token, userType, response.email)
            this.checkAndRefreshTokenIfNeeded(token)
            return { email: response.email, userType }
        } catch (error) {
            const refreshToken = this.getRefreshToken()
            if (!refreshToken) {
                this.logout()
                throw error
            }

            try {
                const refreshed = await this.refreshTokenOrWait()
                this.saveToken(refreshed.token, refreshed.refreshToken, refreshed.userType, refreshed.email)

                const validateResponse = await api.get<{ email: string; userType: string }>(
                    "/api/auth/validate",
                    { token: refreshed.token }
                )
                const finalUserType =
                    validateResponse.userType === "registered" ? "registered" : "guest"
                this.saveToken(refreshed.token, refreshed.refreshToken, finalUserType, validateResponse.email)
                this.checkAndRefreshTokenIfNeeded(refreshed.token)
                return { email: validateResponse.email, userType: finalUserType }
            } catch (refreshError) {
                this.logout()
                throw refreshError
            }
        }
    }

    saveToken(token: string, refreshToken: string, userType: string, email?: string): void {
        localStorage.setItem(this.tokenKey, token)
        localStorage.setItem(this.refreshTokenKey, refreshToken)
        localStorage.setItem(this.userTypeKey, userType)
        if (email) {
            localStorage.setItem(this.userEmailKey, email)
        }
    }

    getUserEmail(): string | null {
        return localStorage.getItem(this.userEmailKey)
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey)
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey)
    }

    getUserType(): "guest" | "registered" | null {
        const userType = localStorage.getItem(this.userTypeKey)
        return userType === "guest" || userType === "registered" ? userType : null
    }

    isRegisteredUser(): boolean {
        return this.getUserType() === "registered"
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey)
        localStorage.removeItem(this.refreshTokenKey)
        localStorage.removeItem(this.userTypeKey)
        localStorage.removeItem(this.userEmailKey)
    }

    isAuthenticated(): boolean {
        return !!this.getToken()
    }
}

export const authService = new AuthService()
