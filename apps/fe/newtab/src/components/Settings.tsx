import { motion } from "framer-motion"
import { Clock as ClockIcon, LogIn, LogOut, User, X } from "lucide-react"
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
}

export function Settings({
  isOpen,
  onClose,
  showNews,
  onShowNewsChange,
  clockHidden,
  onClockHiddenChange,
  clockFormat,
  onClockFormatChange,
}: SettingsProps) {
  const { isRegistered, logout } = useAuth()

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
        onClick={onClose}
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
              aria-label="Close settings"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-6">
            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <User className="size-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Account Status
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {isRegistered ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Registered User
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Guest Mode</span>
                )}
              </div>
              {isRegistered && (
                <button
                  type="button"
                  onClick={logout}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100/80 text-red-700 border border-red-300/80 rounded-lg text-sm transition-colors hover:bg-red-200/80"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              )}
              {!isRegistered && (
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to login or show login modal
                    alert("Login functionality coming soon!")
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100/80 text-blue-700 border border-blue-300/80 rounded-lg text-sm transition-colors hover:bg-blue-200/80"
                >
                  <LogIn className="size-4" />
                  Sign In
                </button>
              )}
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Show news section
                </span>
                <button
                  type="button"
                  onClick={() => onShowNewsChange(!showNews)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
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
            <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <ClockIcon className="size-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Clock
                </span>
              </div>
              <label className="flex items-center justify-between gap-4 cursor-pointer mb-3">
                <span className="text-sm text-slate-700 dark:text-slate-300">Show clock</span>
                <button
                  type="button"
                  onClick={() => onClockHiddenChange(!clockHidden)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
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
              <div className="space-y-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">Time format</span>
                <select
                  value={clockFormat}
                  onChange={(e) => onClockFormatChange(e.target.value as ClockFormat)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Clock time format"
                >
                  <option value="automatic">Automatic</option>
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  )
}
