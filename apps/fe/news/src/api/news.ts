import type { PageResponse } from "@libs/shared"
import type { NewsArticle } from "../types"
import { api } from "./client"

export const newsApi = {
    getNews: async (page: number = 0, size: number = 20, token?: string): Promise<PageResponse<NewsArticle>> => {
        const data = await api.get<PageResponse<NewsArticle>>(`/api/news?page=${page}&size=${size}`, { token })
        console.log("Raw API response:", data)
        return data
    },
}
