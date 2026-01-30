import { NewsArticle, PageResponse as SharedPageResponse } from '@libs/shared'

export type { NewsArticle }

export interface PageResponse<T> extends SharedPageResponse<T> { }
