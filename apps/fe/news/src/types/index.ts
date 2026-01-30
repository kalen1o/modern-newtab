export interface NewsArticle {
    id: number
    title: string
    description: string
    url: string
    source?: string
    publishedAt?: string
    imageUrl?: string
    createdAt: string
}

export interface PageResponse<T> {
    content: T[]
    currentPage: number
    pageSize: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
}
