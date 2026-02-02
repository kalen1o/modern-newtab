import { formatArticleDate } from "@libs/shared"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutGrid, LayoutList, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

export type NewsViewMode = "list" | "featured"

import { newsApi } from "../api/news"
import type { NewsArticle, PageResponse } from "../types"

type NewsGridProps = {
  token?: string
  newsView: NewsViewMode
  onNewsViewChange: (view: NewsViewMode) => void
}

function NewsGrid({ token, newsView, onNewsViewChange }: NewsGridProps) {
  const [pageData, setPageData] = useState<PageResponse<NewsArticle> | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReloading, setIsReloading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isGridVisible50Percent, setIsGridVisible50Percent] = useState(false)

  const toggleNewsView = useCallback(() => {
    const next = newsView === "list" ? "featured" : "list"
    onNewsViewChange(next)
  }, [newsView, onNewsViewChange])
  const newsContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const visibleCards50 = useRef<Set<Element>>(new Set())

  const setCardRef = useCallback((index: number, el: HTMLAnchorElement | null) => {
    cardRefs.current[index] = el
  }, [])

  const loadNews = useCallback(async () => {
    try {
      const data = await newsApi.getNews(currentPage, pageSize, token)

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
  }, [currentPage, pageSize, token])

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
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
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

  const articles = pageData?.content ?? []

  // Re-run when article list or view mode changes so we observe the new card DOM nodes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: newsView required so observer re-attaches after layout change
  useEffect(() => {
    const elements = cardRefs.current.filter(Boolean) as HTMLAnchorElement[]
    if (elements.length === 0) {
      visibleCards50.current.clear()
      setIsGridVisible50Percent(false)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5) {
            visibleCards50.current.add(entry.target)
          } else {
            visibleCards50.current.delete(entry.target)
          }
        }
        setIsGridVisible50Percent(visibleCards50.current.size > 0)
      },
      { threshold: [0.5], rootMargin: "0px" }
    )

    for (const el of elements) {
      observer.observe(el)
    }
    return () => {
      for (const el of elements) {
        observer.unobserve(el)
      }
      observer.disconnect()
      visibleCards50.current.clear()
    }
  }, [pageData?.content, newsView])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (!pageData || newPage < pageData.totalPages)) {
      setCurrentPage(newPage)
      setLoading(true)
    }
  }

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

  if (articles.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[200px] py-8">
          <div className="text-white/60 text-base">No news articles available</div>
        </div>
      </div>
    )
  }

  const cardBase =
    "flex flex-col bg-black/30 border border-white/10 rounded-lg text-inherit shadow-xl backdrop-blur-sm"
  const motionProps = (index: number) => ({
    ref: (el: HTMLAnchorElement | null) => setCardRef(index, el),
    initial: { opacity: 0, y: 20, backdropFilter: "blur(4px)" },
    animate: {
      opacity: isVisible ? 1 : 0.5,
      y: isVisible ? 0 : 20,
      backdropFilter: isVisible ? "blur(24px)" : "blur(4px)",
    },
    transition: { duration: 0.3, ease: "easeInOut" as const },
  })

  const bigCard = (article: NewsArticle, index: number, listView = false) => {
    const isFeatured = !listView
    return (
      <motion.a
        key={article.id}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        {...motionProps(index)}
        className={`w-full flex ${isFeatured ? "flex-col md:flex-row md:overflow-hidden" : "flex-col"} ${listView ? "max-w-[50%]" : ""} ${cardBase}`}
      >
        <div
          className={`p-4 flex flex-col h-full flex-1 min-w-0 ${isFeatured ? "md:order-1" : ""}`}
        >
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
              {formatArticleDate(article.publishedAt)}
            </div>
          )}
        </div>
        {article.imageUrl && (
          <div
            className={`flex-shrink-0 ${isFeatured ? "w-full md:w-2/5 md:max-w-[420px] md:order-2 md:rounded-r-lg md:overflow-hidden" : ""}`}
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              className={`object-cover ${isFeatured ? "w-full h-64 md:h-full md:min-h-[280px] md:rounded-r-lg" : "w-full h-80 rounded-lg mb-4"}`}
            />
          </div>
        )}
      </motion.a>
    )
  }

  const smallCard = (article: NewsArticle, index: number, listView = false) => (
    <motion.a
      key={article.id}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      {...motionProps(index)}
      className={`w-full flex flex-col md:flex-row ${listView ? "max-w-[50%]" : ""} ${cardBase}`}
    >
      <div className="p-4 flex-1 flex flex-col justify-center min-w-0 order-1">
        <div className="flex items-center gap-2 mb-2">
          {article.category && (
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider rounded">
              {article.category}
            </span>
          )}
          {article.source && (
            <span className="text-xs text-white/50 uppercase tracking-wider">{article.source}</span>
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
            {formatArticleDate(article.publishedAt)}
          </div>
        )}
      </div>
      {article.imageUrl && (
        <div className="flex-shrink-0 p-4 border-b md:border-b-0 md:border-l border-white/5 flex items-center justify-center order-2 self-center">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-32 min-h-0 md:w-40 md:h-40 md:min-h-0 object-cover rounded-lg md:rounded-l-none md:rounded-r-lg"
          />
        </div>
      )}
    </motion.a>
  )

  type FeaturedRow =
    | { type: "big-small"; articles: NewsArticle[] }
    | { type: "three-small"; articles: NewsArticle[] }
  const featuredRows = (() => {
    const rows: FeaturedRow[] = []
    let i = 0
    let rowIndex = 0
    while (i < articles.length) {
      if (rowIndex % 2 === 0) {
        const chunk = articles.slice(i, i + 2)
        if (chunk.length > 0) rows.push({ type: "big-small", articles: chunk })
        i += 2
      } else {
        const chunk = articles.slice(i, i + 3)
        if (chunk.length > 0) rows.push({ type: "three-small", articles: chunk })
        i += 3
      }
      rowIndex++
    }
    return rows
  })()

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 relative">
      <div ref={newsContainerRef} className="flex flex-col gap-4 items-center">
        {newsView === "list" ? (
          <AnimatePresence mode="popLayout">
            {articles.map((article, index) => {
              const isBigCard = index % 5 === 0
              return isBigCard ? bigCard(article, index, true) : smallCard(article, index, true)
            })}
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="popLayout">
            {featuredRows.map((row, rowIndex) => {
              const baseIndex = featuredRows
                .slice(0, rowIndex)
                .reduce((acc, r) => acc + r.articles.length, 0)
              if (row.type === "big-small") {
                const [first, second] = row.articles
                return (
                  <motion.div
                    key={row.articles.map((a) => a.id).join("-")}
                    className="grid gap-4 w-full max-w-[1400px] grid-cols-1 md:grid-cols-[2fr_1fr]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {first && bigCard(first, baseIndex + 0, false)}
                    {second && smallCard(second, baseIndex + 1, false)}
                  </motion.div>
                )
              }
              return (
                <motion.div
                  key={row.articles.map((a) => a.id).join("-")}
                  className="grid gap-4 w-full max-w-[1400px] grid-cols-1 md:grid-cols-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {row.articles.map((article, j) => smallCard(article, baseIndex + j, false))}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
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

      <AnimatePresence mode="wait">
        {isGridVisible50Percent && (
          <motion.div
            key="news-actions"
            className="fixed bottom-6 right-6 flex gap-2 z-50"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              type="button"
              onClick={toggleNewsView}
              className="p-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 shadow-xl"
              aria-label={
                newsView === "list"
                  ? "Featured view (1 big + 1 small or 3 small per row)"
                  : "List view"
              }
              title={
                newsView === "list"
                  ? "Featured view (1 big + 1 small or 3 small per row)"
                  : "List view"
              }
            >
              {newsView === "list" ? (
                <LayoutGrid className="size-5" aria-hidden />
              ) : (
                <LayoutList className="size-5" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={handleReload}
              disabled={isReloading || loading}
              className="p-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 disabled:bg-white/5 disabled:border-white/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-xl"
              aria-label="Reload news"
              title="Reload news"
            >
              <RefreshCw className={`size-5 ${isReloading ? "animate-spin" : ""}`} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export type { NewsGridProps }

export default NewsGrid
