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

class AuthService {
    private tokenKey = "authToken"
    private refreshTokenKey = "refreshToken"
    private userTypeKey = "userType"
    private userEmailKey = "userEmail"

    async getGuestToken(): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/guest")
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        return response
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/login", credentials)
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        return response
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/register", data)
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        return response
    }

    async refreshToken(): Promise<AuthResponse> {
        const token = this.getToken()
        if (!token) {
            throw new Error("No refresh token available")
        }
        const response = await api.post<AuthResponse>("/api/auth/refresh", {})
        this.saveToken(response.token, response.refreshToken, response.userType, response.email)
        return response
    }

    async validateToken(): Promise<{ email: string; userType: string }> {
        const token = this.getToken()
        if (!token) {
            throw new Error("No token available")
        }
        const response = await api.get<{ email: string; userType: string }>("/api/auth/validate")
        const userType = response.userType === "registered" ? "registered" : "guest"
        this.saveToken(token, this.getRefreshToken() ?? token, userType, response.email)
        return { email: response.email, userType }
    }

    saveToken(token: string, refreshToken: string, userType: string, email?: string) {
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

    logout() {
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
