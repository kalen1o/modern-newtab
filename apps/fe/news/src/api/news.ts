import { PageResponse, NewsArticle } from "../types"

const API_BASE = 'http://localhost:8082'

async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('authToken')

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...(options.headers ? options.headers as Record<string, string> : {}),
    })

    if (token) {
        headers.append('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(`${API_BASE}${url}`, { ...options, headers })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export const newsApi = {
    get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
    getNews: async (page: number = 0, size: number = 20): Promise<PageResponse<NewsArticle>> => {
        const data = await apiRequest<PageResponse<NewsArticle>>(`/api/news?page=${page}&size=${size}`, { method: 'GET' })
        console.log('Raw API response:', data)

        // New PageResponse format
        return data
    },
}
