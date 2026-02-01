import { AnimatePresence, motion } from "framer-motion"
import { Settings as SettingsIcon } from "lucide-react"
import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { Settings } from "./components/Settings"
import { useAuth } from "./hooks/useAuth"

// Lazy load microfrontends with proper error handling
const AutocompleteInput = lazy(() => import("autocomplete/Autocomplete"))
const NewsGrid = lazy(() => import("news/News"))

function App() {
  const [showNews, setShowNews] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bgOpacity, setBgOpacity] = useState(0)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const newsSectionRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, isRegistered, loading: authLoading, getGuestToken, token } = useAuth()

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      getGuestToken().catch((error) => {
        console.error("Failed to get guest token:", error)
      })
    }
  }, [isAuthenticated, authLoading, getGuestToken])

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
        rootMargin: "-100px",
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
      style={
        {
          background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #475569 100%)",
          "--bg-opacity": bgOpacity,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-100 ease-out"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
          zIndex: 0,
        }}
      />

      <div className="flex flex-col h-screen relative z-[5]">
        <AnimatePresence>
          {!isInputFocused && (
            <motion.header
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex justify-between items-center px-8 py-6 flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <img
                  src="/husky.png"
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <h1
                  className="m-0 text-4xl font-bold text-slate-900"
                  style={{
                    textShadow: "0 1px 2px rgba(255,255,255,0.9), 0 0 1px rgba(255,255,255,0.6)",
                  }}
                >
                  aske
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 bg-white/10 text-white border border-white/20 rounded-lg cursor-pointer transition-colors hover:bg-white/20"
                  aria-label="Open settings"
                >
                  <SettingsIcon className="size-5" />
                </button>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        <section
          className={`flex-1 flex flex-col px-8 transition-all items-center ${isInputFocused ? "absolute inset-0 z-[10] p-0 justify-start" : ""}`}
        >
          <motion.div
            className="w-full"
            initial={{ height: "32px" }}
            animate={isInputFocused ? { height: "40vh" } : { height: "32px" }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="w-full max-w-[600px]"
            initial={{
              width: "600px",
              maxWidth: "600px",
              scale: 1,
            }}
            animate={
              isInputFocused
                ? {
                    width: "90vw",
                    scale: 1.1,
                  }
                : {
                    width: "600px",
                    scale: 1,
                  }
            }
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
          >
            <ErrorBoundary appName="Search Component">
              <Suspense fallback={null}>
                <AutocompleteInput
                  onFocusChange={setIsInputFocused}
                  isRegisteredUser={isRegistered}
                />
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
              <Suspense
                fallback={
                  <div className="text-white/70 text-lg py-8 text-center">Loading news...</div>
                }
              >
                <NewsGrid {...({ token: token ?? undefined } as any)} />
              </Suspense>
            </ErrorBoundary>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <Settings
            key="settings"
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            showNews={showNews}
            onShowNewsChange={setShowNews}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
