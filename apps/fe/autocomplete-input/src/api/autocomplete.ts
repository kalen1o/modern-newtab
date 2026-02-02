import { api } from "./client"

export interface HistoryItem {
  query: string
}

export interface HistoryResponse {
  items: HistoryItem[]
}

export const autocompleteApi = {
  getHistory: async (): Promise<HistoryResponse> => {
    const data = await api.get<HistoryResponse>("/api/history")
    return data
  },

  saveHistory: async (query: string): Promise<void> => {
    await api.post<void>("/api/history", { query })
  },
}
