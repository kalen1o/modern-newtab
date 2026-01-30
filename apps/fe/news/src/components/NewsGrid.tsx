import { useState, useEffect } from 'react'
import { NewsArticle, PageResponse } from '../types'
import { newsApi } from '../api/news'

function NewsGrid() {
  const [pageData, setPageData] = useState<PageResponse<NewsArticle> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNews()
  }, [currentPage])

  const loadNews = async () => {
    try {
      console.log('Loading news page:', currentPage)
      const data = await newsApi.getNews(currentPage, pageSize)
      console.log('API response:', data)

      if (!data) {
        throw new Error('No data received from API')
      }

      setPageData(data)
      setError(null)
    } catch (error) {
      console.error('Failed to load news:', error)
      setError('Failed to load news articles')
      setPageData(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!pageData || newPage < pageData.totalPages)) {
      setCurrentPage(newPage)
      setLoading(true)
    }
  }

  const articles = pageData?.content ?? []
  console.log('Articles array:', articles, 'Type:', typeof articles)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-white/60 text-base">Loading news...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-center">
            <div className="text-white/60 text-base mb-4">{error}</div>
            <button
              onClick={loadNews}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-white/60 text-base">No news articles available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 w-full max-w-[1400px] mx-auto">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col bg-white/8 border border-white/10 rounded-lg overflow-hidden text-inherit transition-all hover:-translate-y-1 hover:bg-white/12 hover:border-white/20 hover:shadow-lg"
          >
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-[180px] object-cover border-b border-white/5"
              />
            )}
            <div className="p-4 flex-1 flex flex-col">
              {article.source && (
                <div className="text-xs text-indigo-400 uppercase font-semibold mb-2 tracking-wider">
                  {article.source}
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2 leading-tight line-clamp-2 text-white">
                {article.title}
              </h3>
              {article.description && (
                <p className="text-sm text-white/70 mb-3 leading-relaxed line-clamp-3 flex-1">
                  {article.description}
                </p>
              )}
              {article.publishedAt && (
                <div className="text-xs text-white/50 mt-auto pt-3">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>

      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8 px-4 flex-wrap">
          <button
            className="px-4 py-2 bg-indigo-500/20 text-white border border-indigo-500/40 rounded-lg cursor-pointer text-sm transition-all hover:bg-indigo-500/30 hover:border-indigo-500/50 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(0)}
            disabled={currentPage === 0}
          >
            First
          </button>
          <button
            className="px-4 py-2 bg-indigo-500/20 text-white border border-indigo-500/40 rounded-lg cursor-pointer text-sm transition-all hover:bg-indigo-500/30 hover:border-indigo-500/50 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pageData.hasPrevious}
          >
            Previous
          </button>
          <span className="text-white/70 text-sm px-4">
            Page {currentPage + 1} of {pageData.totalPages} ({pageData.totalElements} total)
          </span>
          <button
            className="px-4 py-2 bg-indigo-500/20 text-white border border-indigo-500/40 rounded-lg cursor-pointer text-sm transition-all hover:bg-indigo-500/30 hover:border-indigo-500/50 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!pageData.hasNext}
          >
            Next
          </button>
          <button
            className="px-4 py-2 bg-indigo-500/20 text-white border border-indigo-500/40 rounded-lg cursor-pointer text-sm transition-all hover:bg-indigo-500/30 hover:border-indigo-500/50 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handlePageChange(pageData.totalPages - 1)}
            disabled={currentPage === pageData.totalPages - 1}
          >
            Last
          </button>
        </div>
      )}
    </div>
  )
}

export default NewsGrid
