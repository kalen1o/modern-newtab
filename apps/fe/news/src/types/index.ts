import type { NewsArticle, PageResponse as SharedPageResponse } from "@libs/shared"

export type { NewsArticle }

export type PageResponse<T> = SharedPageResponse<T>
