import { AnimatePresence, motion } from "framer-motion"
import { Settings as SettingsIcon } from "lucide-react"
import type { ClockFormat } from "./Clock"
import { Clock } from "./Clock"

interface HeaderProps {
  isInputFocused: boolean
  clockHidden: boolean
  clockFormat: ClockFormat
  onSettingsClick: () => void
}

export function Header({ isInputFocused, clockHidden, clockFormat, onSettingsClick }: HeaderProps) {
  return (
    <AnimatePresence>
      {!isInputFocused && (
        <motion.header
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex justify-between items-center px-8 py-6 flex-shrink-0"
        >
          <Clock hidden={clockHidden} format={clockFormat} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSettingsClick}
              className="p-2 bg-white/10 text-white border border-white/20 rounded-lg cursor-pointer transition-colors hover:bg-white/20"
              aria-label="Open settings"
            >
              <SettingsIcon className="size-5" />
            </button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  )
}
