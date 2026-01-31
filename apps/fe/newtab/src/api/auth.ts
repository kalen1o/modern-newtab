import { api } from "./client"

export interface AuthResponse {
    token: string
    refreshToken: string
    type: string
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

    async getGuestToken(): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/guest")
        this.saveToken(response.token, response.refreshToken)
        return response
    }

    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/login", credentials)
        this.saveToken(response.token, response.refreshToken)
        return response
    }

    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/api/auth/register", data)
        this.saveToken(response.token, response.refreshToken)
        return response
    }

    async refreshToken(): Promise<AuthResponse> {
        const token = this.getToken()
        if (!token) {
            throw new Error("No refresh token available")
        }
        const response = await api.post<AuthResponse>("/api/auth/refresh", {})
        this.saveToken(response.token, response.refreshToken)
        return response
    }

    async validateToken(): Promise<string> {
        const token = this.getToken()
        if (!token) {
            throw new Error("No token available")
        }
        return api.get<string>("/api/auth/validate")
    }

    saveToken(token: string, refreshToken: string) {
        localStorage.setItem(this.tokenKey, token)
        localStorage.setItem(this.refreshTokenKey, refreshToken)
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey)
    }

    getRefreshToken(): string | null {
        return localStorage.getItem(this.refreshTokenKey)
    }

    logout() {
        localStorage.removeItem(this.tokenKey)
        localStorage.removeItem(this.refreshTokenKey)
    }

    isAuthenticated(): boolean {
        return !!this.getToken()
    }
}

export const authService = new AuthService()
