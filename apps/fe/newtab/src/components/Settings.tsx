import { motion } from "framer-motion"
import { X } from "lucide-react"

type SettingsProps = {
  isOpen: boolean
  onClose: () => void
  showNews: boolean
  onShowNewsChange: (show: boolean) => void
}

export function Settings({ isOpen, onClose, showNews, onShowNewsChange }: SettingsProps) {
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
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm text-slate-700 dark:text-slate-300">Show news section</span>
              <button
                type="button"
                onClick={() => onShowNewsChange(!showNews)}
                className="px-4 py-2 bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {showNews ? "Hide News" : "Show News"}
              </button>
            </label>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  )
}
