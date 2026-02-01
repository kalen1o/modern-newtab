import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import { newsApi } from "../api/news"
import type { NewsArticle, PageResponse } from "../types"

function NewsGrid() {
  const [pageData, setPageData] = useState<PageResponse<NewsArticle> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReloading, setIsReloading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const newsContainerRef = useRef<HTMLDivElement>(null)

  const loadNews = useCallback(async () => {
    try {
      const data = await newsApi.getNews(currentPage, pageSize)

      if (!data) {
        throw new Error("No data received from API")
      }

      setPageData(data)
      setError(null)
    } catch (error) {
      console.error("Failed to load news:", error)
      setError("Failed to load news articles")
      setPageData(null)
    } finally {
      setLoading(false)
      setIsReloading(false)
    }
  }, [currentPage, pageSize])

  const handleReload = useCallback(() => {
    setIsReloading(true)
    setLoading(true)
    loadNews()
  }, [loadNews])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      {
        threshold: 0.95,
        rootMargin: "0px",
      }
    )

    const currentRef = newsContainerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!pageData || newPage < pageData.totalPages)) {
      setCurrentPage(newPage)
      setLoading(true)
    }
  }

  const articles = pageData?.content ?? []

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-white/60 text-base">Loading news...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-center">
            <div className="text-white/60 text-base mb-4">{error}</div>
            <button
              type="button"
              onClick={handleReload}
              disabled={isReloading}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`} />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-white/60 text-base">No news articles available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 relative">
      <div ref={newsContainerRef} className="flex flex-col gap-4 items-center">
        {articles.map((article, index) => {
          const isBigCard = index % 5 === 0
          return isBigCard ? (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full max-w-[50%] flex flex-col bg-white/10 border border-white/20 rounded-lg text-inherit transition-all hover:-translate-y-1 hover:bg-white/15 hover:border-white/30 hover:shadow-lg shadow-xl ${
                isVisible ? "backdrop-blur-xl" : "backdrop-blur-sm"
              }`}
              style={{
                opacity: isVisible ? 1 : 0.5,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out",
              }}
            >
              <div className="p-4 flex flex-col h-full">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-80 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="flex items-center gap-2 mb-3">
                  {article.category && (
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider rounded">
                      {article.category}
                    </span>
                  )}
                  {article.source && (
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      {article.source}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-3 leading-tight line-clamp-2 text-white">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-base text-white/70 mb-4 leading-relaxed line-clamp-3 flex-1">
                    {article.description}
                  </p>
                )}
                {article.publishedAt && (
                  <div className="text-sm text-white/50 mt-auto pt-3 border-t border-white/5">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
            </a>
          ) : (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full max-w-[50%] flex flex-col md:flex-row bg-white/10 border border-white/20 rounded-lg text-inherit transition-all hover:-translate-y-1 hover:bg-white/15 hover:border-white/30 hover:shadow-lg shadow-xl ${
                isVisible ? "backdrop-blur-xl" : "backdrop-blur-sm"
              }`}
              style={{
                opacity: isVisible ? 1 : 0.5,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out",
              }}
            >
              <div className="p-4 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  {article.category && (
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider rounded">
                      {article.category}
                    </span>
                  )}
                  {article.source && (
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                      {article.source}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2 leading-tight line-clamp-2 text-white">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-sm text-white/70 mb-2 leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                )}
                {article.publishedAt && (
                  <div className="text-xs text-white/50 mt-auto pt-2 border-t border-white/5">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg p-4 border-b md:border-b-0 md:border-l border-white/5"
                />
              )}
            </a>
          )
        })}
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

      <button
        type="button"
        onClick={handleReload}
        disabled={isReloading || loading}
        className="fixed bottom-6 right-6 p-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg cursor-pointer transition-colors hover:bg-white/20 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-xl z-50"
        aria-label="Reload news"
        title="Reload news"
      >
        <RefreshCw className={`size-5 ${isReloading ? "animate-spin" : ""}`} />
      </button>
    </div>
  )
}

export default NewsGrid
