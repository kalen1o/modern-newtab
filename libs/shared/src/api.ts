export interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

const API_BASE = "http://localhost:8082"

export async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("authToken")

  const headers = new Headers({
    "Content-Type": "application/json",
    ...(options.headers || {}),
  })

  if (token) {
    headers.append("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  get: <T>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(url, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(url, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>(url, { ...options, method: "DELETE" }),
}
