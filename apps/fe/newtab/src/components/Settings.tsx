import { useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock as ClockIcon, Image as ImageIcon, Info, LogIn, LogOut, X } from "lucide-react"
import { BACKGROUNDS } from "../constants"
import { useAuth } from "../hooks/useAuth"
import type { ClockFormat } from "./Clock"

type SettingsProps = {
  isOpen: boolean
  onClose: () => void
  showNews: boolean
  onShowNewsChange: (show: boolean) => void
  clockHidden: boolean
  onClockHiddenChange: (hidden: boolean) => void
  clockFormat: ClockFormat
  onClockFormatChange: (format: ClockFormat) => void
  backgroundImage: string
  onBackgroundImageChange: (filename: string) => void
}

export type { SettingsProps }

export function Settings({
  isOpen,
  onClose,
  showNews,
  onShowNewsChange,
  clockHidden,
  onClockHiddenChange,
  clockFormat,
  onClockFormatChange,
  backgroundImage,
  onBackgroundImageChange,
}: SettingsProps) {
  const { isRegistered, logout } = useAuth()

  const handleClose = useCallback(() => {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.2 }}
        className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white/95 dark:bg-slate-900/95 shadow-xl border-l border-white/20"
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Customize new tab page</h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              aria-label="Close settings"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-5">
            {/* Appearance */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Appearance
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-700 dark:text-slate-300 shrink-0">
                    Background
                  </span>
                  <select
                    value={backgroundImage}
                    onChange={(e) => onBackgroundImageChange(e.target.value)}
                    className="min-w-0 flex-1 max-w-[140px] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Background image"
                  >
                    {BACKGROUNDS.map((bg) => (
                      <option key={bg.id} value={bg.filename}>
                        {bg.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <span className="text-sm text-slate-700 dark:text-slate-300 shrink-0">
                    Show news section
                  </span>
                  <button
                    type="button"
                    onClick={() => onShowNewsChange(!showNews)}
                    className={`relative w-12 h-6 shrink-0 rounded-full transition-colors duration-200 ${
                      showNews ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                    aria-pressed={showNews}
                    aria-label="Toggle news visibility"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        showNews ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </section>
            {/* Clock */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Clock
                </span>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <span className="text-sm text-slate-700 dark:text-slate-300 shrink-0">
                    Show clock
                  </span>
                  <button
                    type="button"
                    onClick={() => onClockHiddenChange(!clockHidden)}
                    className={`relative w-12 h-6 shrink-0 rounded-full transition-colors duration-200 ${
                      !clockHidden ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                    aria-pressed={!clockHidden}
                    aria-label="Toggle clock visibility"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        !clockHidden ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-700 dark:text-slate-300 shrink-0">
                    Time format
                  </span>
                  <select
                    value={clockFormat}
                    onChange={(e) => onClockFormatChange(e.target.value as ClockFormat)}
                    className="min-w-0 flex-1 max-w-[140px] px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Clock time format"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="12h">12 hours</option>
                    <option value="24h">24 hours</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
          {/* Footer: account status + Sign in */}
          <footer className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {isRegistered ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Logged in
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      Guest mode
                    </span>
                  )}
                </span>
                <span
                  className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-help"
                  title="Logged in user will have history and can sync settings and preference all over other devices"
                >
                  <Info className="size-4" />
                </span>
              </div>
            </div>
            {isRegistered ? (
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100/80 text-red-700 border border-red-300/80 rounded-lg text-sm transition-colors hover:bg-red-200/80"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  alert("Login functionality coming soon!")
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100/80 text-blue-700 border border-blue-300/80 rounded-lg text-sm transition-colors hover:bg-blue-200/80"
              >
                <LogIn className="size-4" />
                Sign in
              </button>
            )}
          </footer>
        </div>
      </motion.aside>
    </motion.div>
  )
}
