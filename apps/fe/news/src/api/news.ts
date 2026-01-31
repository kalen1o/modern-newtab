import { api, type PageResponse } from "@libs/shared"
import type { NewsArticle } from "../types"

export const newsApi = {
  getNews: async (page: number = 0, size: number = 20): Promise<PageResponse<NewsArticle>> => {
    const data = await api.get<PageResponse<NewsArticle>>(`/api/news?page=${page}&size=${size}`)
    console.log("Raw API response:", data)
    return data
  },
}
