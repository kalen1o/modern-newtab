import { motion } from "framer-motion"
import { LogIn, UserPlus, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../hooks/useAuth"

type AuthMode = "signin" | "signup"

interface AuthModalProps {
  onClose: () => void
}

const inputClass =
  "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const { login, signup, error: authError, loading } = useAuth()

  const resetForm = useCallback(() => {
    setEmail("")
    setPassword("")
    setLocalError(null)
  }, [])

  const handleClose = useCallback(() => {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    resetForm()
    setMode("signin")
    onClose()
  }, [onClose, resetForm])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleClose])

  const validate = (): boolean => {
    if (!email.trim()) {
      setLocalError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setLocalError("Invalid email format")
      return false
    }
    if (!password) {
      setLocalError("Password is required")
      return false
    }
    if (mode === "signup" && password.length < 8) {
      setLocalError("Password must be at least 8 characters")
      return false
    }
    setLocalError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      if (mode === "signin") {
        await login(email, password)
      } else {
        await signup(email, password)
      }
      handleClose()
    } catch {
      // Error is surfaced via authError from useAuth
    }
  }

  const displayError = localError ?? authError

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="flex justify-end p-3 absolute top-0 right-0 z-10">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 pt-12 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 p-3">
              {mode === "signin" ? <LogIn className="size-5" /> : <UserPlus className="size-5" />}
            </div>
            <div className="space-y-1">
              <h2
                id="auth-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === "signin"
                  ? "Sign in to sync your preferences and history across devices."
                  : "Create a free account to save your history and preferences."}
              </p>
            </div>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div
                  className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm"
                  role="alert"
                >
                  {displayError}
                </div>
              )}

              <div>
                <label htmlFor="signin-email" className="sr-only">
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="signin-password" className="sr-only">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {loading ? (
                  <span className="animate-pulse">Please wait...</span>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Sign in
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setLocalError(null)
                  }}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline-offset-2 hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {displayError && (
                <div
                  className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm"
                  role="alert"
                >
                  {displayError}
                </div>
              )}

              <div>
                <label htmlFor="signup-email" className="sr-only">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="sr-only">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {loading ? (
                  <span className="animate-pulse">Please wait...</span>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Create account
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin")
                    setLocalError(null)
                  }}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline-offset-2 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
