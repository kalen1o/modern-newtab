import { lazy, Suspense } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ErrorBoundary } from "./ErrorBoundary"

// Lazy load microfrontend with proper error handling
const NewsGrid = lazy(() => import("news/News"))

interface NewsSectionProps {
  showNews: boolean
  token: string | null | undefined
}

export function NewsSection({ showNews, token }: NewsSectionProps) {
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
              <NewsGrid token={token ?? undefined} />
            </Suspense>
          </ErrorBoundary>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
