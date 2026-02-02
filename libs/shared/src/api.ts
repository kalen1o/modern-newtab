export interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>
  token?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface ApiClient {
  get: <T>(url: string, options?: ApiRequestOptions) => Promise<T>
  post: <T>(url: string, body?: unknown, options?: ApiRequestOptions) => Promise<T>
  put: <T>(url: string, body?: unknown, options?: ApiRequestOptions) => Promise<T>
  delete: <T>(url: string, options?: ApiRequestOptions) => Promise<T>
}

/**
 * Creates an API client with the specified base URL
 */
export function createApiClient(apiBaseUrl: string): ApiClient {
  async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const token = options.token ?? localStorage.getItem("authToken")

    const headers = new Headers({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    })

    if (token) {
      headers.append("Authorization", `Bearer ${token}`)
    }

    const response = await fetch(`${apiBaseUrl}${url}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  return {
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
}
