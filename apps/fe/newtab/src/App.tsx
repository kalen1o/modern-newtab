import { useState, Suspense, lazy, useEffect, useRef } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { motion, AnimatePresence } from 'framer-motion'

// Lazy load microfrontends with proper error handling
const AutocompleteInput = lazy(() => import('autocomplete/Autocomplete'))
const NewsGrid = lazy(() => import('news/News'))

function App() {
  const [showNews, setShowNews] = useState(true)
  const [bgOpacity, setBgOpacity] = useState(0)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const newsSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const intersectionRatio = entry.intersectionRatio
            setBgOpacity(Math.min(intersectionRatio * 2, 0.8))
          }
        })
      },
      {
        threshold: Array.from({ length: 100 }, (_, i) => i / 100),
        rootMargin: '-100px'
      }
    )

    const currentRef = newsSectionRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        '--bg-opacity': bgOpacity
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 pointer-events-none transition-colors duration-100 ease-out"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
          zIndex: 0
        }}
      />

      <div className="flex flex-col h-screen relative z-[5]">
        <AnimatePresence>
          {!isInputFocused && (
            <motion.header
              initial={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-between items-center px-8 py-6 bg-black/30 backdrop-blur-[10px] border-b border-white/10 flex-shrink-0"
            >
              <h1 className="m-0 text-4xl font-bold text-white drop-shadow-md">
                NewTab
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNews(!showNews)}
                  className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg cursor-pointer text-sm transition-colors hover:bg-white/20"
                >
                  {showNews ? 'Hide News' : 'Show News'}
                </button>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        <section className={`flex-1 flex flex-col px-8 transition-all duration-300 items-center ${isInputFocused ? 'absolute inset-0 z-[10] p-0 justify-start' : ''}`}>
          <motion.div
            className="w-full max-w-[600px]"
            initial={{
              width: '600px',
              maxWidth: '600px',
              marginTop: 32,
              scale: 1
            }}
            animate={{
              width: isInputFocused ? '90vw' : '600px',
              marginTop: isInputFocused ? '35vh' : '32px',
              scale: isInputFocused ? 1.1 : 1
            }}
            transition={{
              duration: 0.4,
              ease: 'easeInOut'
            }}
          >
            <ErrorBoundary appName="Search Component">
              <Suspense fallback={<div className="text-white/70 text-lg py-8 text-center">Loading search...</div>}>
                <AutocompleteInput onFocusChange={setIsInputFocused} />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </section>
      </div>

      <AnimatePresence>
        {showNews && !isInputFocused && (
          <motion.section
            ref={newsSectionRef}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="relative w-full px-8 py-8"
          >
            <ErrorBoundary appName="News Component">
              <Suspense fallback={<div className="text-white/70 text-lg py-8 text-center">Loading news...</div>}>
                <NewsGrid />
              </Suspense>
            </ErrorBoundary>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
