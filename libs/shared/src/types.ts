export interface User {
  id: number
  email: string
  created_at: Date
  updated_at: Date
}

export interface SearchHistory {
  id: number
  user_id?: number
  query: string
  created_at: Date
}

export interface Sponsor {
  id: number
  name: string
  type: "image" | "video"
  media_url: string
  link_url?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface NewsArticle {
  id: number
  title: string
  description?: string
  url: string
  source?: string
  imageUrl?: string
  publishedAt?: Date
  createdAt: Date
}

export interface UserPreferences {
  id: number
  user_id?: number
  theme: "light" | "dark" | "auto"
  background_type: "image" | "video"
  show_news: boolean
  show_sponsors: boolean
  show_history: boolean
  created_at: Date
  updated_at: Date
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
