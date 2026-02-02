import { AnimatePresence, motion } from "framer-motion"
import { lazy, Suspense, useCallback, useState } from "react"
import { type NewsViewMode, readNewsView, writeNewsView } from "../utils/storage"
import { ErrorBoundary } from "./ErrorBoundary"

// Lazy load microfrontend with proper error handling
const NewsGrid = lazy(() => import("news/News"))

interface NewsSectionProps {
  showNews: boolean
  token: string | null | undefined
}

export function NewsSection({ showNews, token }: NewsSectionProps) {
  const [newsView, setNewsView] = useState<NewsViewMode>(() => readNewsView())
  console.log("newsView", newsView)
  const handleNewsViewChange = useCallback((view: NewsViewMode) => {
    setNewsView(view)
    writeNewsView(view)
  }, [])

  return (
    <AnimatePresence>
      {showNews && (
        <motion.section
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="relative w-full px-8 py-8"
        >
          <ErrorBoundary appName="News Component">
            <Suspense
              fallback={
                <div className="text-white/70 text-lg py-8 text-center">Loading news...</div>
              }
            >
              <NewsGrid
                token={token ?? undefined}
                newsView={newsView}
                onNewsViewChange={handleNewsViewChange}
              />
            </Suspense>
          </ErrorBoundary>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
