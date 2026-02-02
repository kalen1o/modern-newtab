import { AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { BannerSection } from "./components/BannerSection"
import type { ClockFormat } from "./components/Clock"
import { Header } from "./components/Header"
import { NewsSection } from "./components/NewsSection"
import { Settings } from "./components/Settings"
import type { BackgroundConfig, SearchEngineId } from "./constants"
import { useAuth } from "./hooks/useAuth"
import {
  CLOCK_FORMAT_KEY,
  CLOCK_HIDDEN_KEY,
  readBackground,
  readClockFormat,
  readClockHidden,
  readSearchEngine,
  writeBackground,
  writeSearchEngine,
} from "./utils/storage"

const BG_OVERLAY_MAX_OPACITY = 0.5

function App() {
  const [showNews, setShowNews] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bgOpacity, setBgOpacity] = useState(0)
  const [searchEngine, setSearchEngine] = useState<SearchEngineId>(readSearchEngine)
  const [clockHidden, setClockHidden] = useState(readClockHidden)
  const [clockFormat, setClockFormat] = useState<ClockFormat>(readClockFormat)
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(readBackground)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const initialScreenRef = useRef<HTMLDivElement | null>(null)
  const { isAuthenticated, isRegistered, loading: authLoading, getGuestToken, token } = useAuth()

  useEffect(() => {
    const el = initialScreenRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const ratio = entry.intersectionRatio
          setBgOpacity((1 - ratio) * BG_OVERLAY_MAX_OPACITY)
        }
      },
      {
        threshold: Array.from({ length: 101 }, (_, i) => i / 100),
      }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      getGuestToken().catch((error) => {
        console.error("Failed to get guest token:", error)
      })
    }
  }, [isAuthenticated, authLoading, getGuestToken])

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ "--bg-opacity": bgOpacity } as React.CSSProperties}
    >
      <div
        className="fixed inset-0"
        style={
          backgroundConfig.type === "image"
            ? {
                backgroundImage: `url('/backgrounds/${backgroundConfig.filename}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                zIndex: 0,
              }
            : backgroundConfig.type === "gradient"
              ? {
                  background: `linear-gradient(${backgroundConfig.direction}, ${backgroundConfig.color1}, ${backgroundConfig.color2})`,
                  zIndex: 0,
                }
              : {
                  backgroundColor: backgroundConfig.color,
                  zIndex: 0,
                }
        }
        aria-hidden
      />
      <div
        className="fixed inset-0 pointer-events-none transition-colors duration-100 ease-out"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
          zIndex: 0,
        }}
      />

      <div ref={initialScreenRef} className="flex flex-col h-screen relative z-[5]">
        <Header
          isInputFocused={isInputFocused}
          clockHidden={clockHidden}
          clockFormat={clockFormat}
          onSettingsClick={() => setSettingsOpen(true)}
        />

        <BannerSection
          isInputFocused={isInputFocused}
          onFocusChange={setIsInputFocused}
          isRegisteredUser={isRegistered}
          searchEngine={searchEngine}
        />
      </div>

      <NewsSection showNews={showNews} token={token} />

      <AnimatePresence>
        {settingsOpen && (
          <Settings
            key="settings"
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            showNews={showNews}
            onShowNewsChange={setShowNews}
            searchEngine={searchEngine}
            onSearchEngineChange={(id: SearchEngineId) => {
              setSearchEngine(id)
              writeSearchEngine(id)
            }}
            clockHidden={clockHidden}
            onClockHiddenChange={(hidden: boolean) => {
              setClockHidden(hidden)
              try {
                localStorage.setItem(CLOCK_HIDDEN_KEY, String(hidden))
              } catch {
                // ignore
              }
            }}
            clockFormat={clockFormat}
            onClockFormatChange={(format: ClockFormat) => {
              setClockFormat(format)
              try {
                localStorage.setItem(CLOCK_FORMAT_KEY, format)
              } catch {
                // ignore
              }
            }}
            backgroundConfig={backgroundConfig}
            onBackgroundConfigChange={(config: BackgroundConfig) => {
              setBackgroundConfig(config)
              writeBackground(config)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
