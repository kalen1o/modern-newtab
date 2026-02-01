import { AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { BannerSection } from "./components/BannerSection"
import type { ClockFormat } from "./components/Clock"
import { Header } from "./components/Header"
import { NewsSection } from "./components/NewsSection"
import { Settings } from "./components/Settings"
import { BACKGROUND_KEY, BACKGROUNDS } from "./constants"
import { useAuth } from "./hooks/useAuth"

const CLOCK_HIDDEN_KEY = "newtab-clock-hidden"
const CLOCK_FORMAT_KEY = "newtab-clock-format"

function readClockHidden(): boolean {
  try {
    const v = localStorage.getItem(CLOCK_HIDDEN_KEY)
    return v === "true"
  } catch {
    return false
  }
}

function readClockFormat(): ClockFormat {
  try {
    const v = localStorage.getItem(CLOCK_FORMAT_KEY)
    if (v === "12h" || v === "24h" || v === "automatic") return v
  } catch {
    // ignore
  }
  return "automatic"
}

function readBackground(): string {
  try {
    const v = localStorage.getItem(BACKGROUND_KEY)
    const valid = BACKGROUNDS.some((b) => b.filename === v)
    if (valid && v) return v
  } catch {
    // ignore
  }
  return BACKGROUNDS[0].filename
}

function App() {
  const [showNews, setShowNews] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bgOpacity, setBgOpacity] = useState(0)
  const [clockHidden, setClockHidden] = useState(readClockHidden)
  const [clockFormat, setClockFormat] = useState<ClockFormat>(readClockFormat)
  const [backgroundImage, setBackgroundImage] = useState(readBackground)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const { isAuthenticated, isRegistered, loading: authLoading, getGuestToken, token } = useAuth()

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
        style={{
          backgroundImage: `url('/backgrounds/${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          zIndex: 0,
        }}
        aria-hidden
      />
      <div
        className="fixed inset-0 pointer-events-none transition-colors duration-100 ease-out"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
          zIndex: 1,
        }}
      />

      <div className="flex flex-col h-screen relative z-[5]">
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
        />
      </div>

      <NewsSection showNews={showNews} token={token} onIntersectionRatioChange={setBgOpacity} />

      <AnimatePresence>
        {settingsOpen && (
          <Settings
            key="settings"
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            showNews={showNews}
            onShowNewsChange={setShowNews}
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
            backgroundImage={backgroundImage}
            onBackgroundImageChange={(filename: string) => {
              setBackgroundImage(filename)
              try {
                localStorage.setItem(BACKGROUND_KEY, filename)
              } catch {
                // ignore
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
