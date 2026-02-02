import { motion } from "framer-motion"
import { lazy, Suspense } from "react"
import type { SearchEngineId } from "../constants"
import { SEARCH_ENGINES } from "../constants"
import { ErrorBoundary } from "./ErrorBoundary"

// Lazy load microfrontend with proper error handling
const AutocompleteInput = lazy(() => import("autocomplete/Autocomplete"))

interface BannerSectionProps {
  isInputFocused: boolean
  onFocusChange: (focused: boolean) => void
  isRegisteredUser: boolean
  searchEngine: SearchEngineId
}

export function BannerSection({
  isInputFocused,
  onFocusChange,
  isRegisteredUser,
  searchEngine,
}: BannerSectionProps) {
  const searchUrlTemplate =
    SEARCH_ENGINES.find((e) => e.id === searchEngine)?.urlTemplate ?? SEARCH_ENGINES[0].urlTemplate
  return (
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
        className="w-full max-w-[400px]"
        initial={{
          width: "400px",
          maxWidth: "400px",
          scale: 1,
        }}
        animate={
          isInputFocused
            ? {
                width: "90vw",
                scale: 1.1,
              }
            : {
                width: "400px",
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
              onFocusChange={onFocusChange}
              isRegisteredUser={isRegisteredUser}
              searchUrlTemplate={searchUrlTemplate}
            />
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    </section>
  )
}
