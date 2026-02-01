import { Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../api/client"

interface AutocompleteInputProps {
  logoSrc?: string
  onSearch?: (query: string) => void
  onFocusChange?: (isFocused: boolean) => void
  isRegisteredUser?: boolean
}

function AutocompleteInput({
  logoSrc = "/husky.png",
  onSearch,
  onFocusChange,
  isRegisteredUser = false,
}: AutocompleteInputProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isDropdownClosing, setIsDropdownClosing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadHistory = useCallback(async () => {
    // Only load history for registered users
    if (!isRegisteredUser) {
      setHistory([])
      return
    }

    try {
      const data = await api.get<{ items: { query: string }[] }>("/api/history")
      setHistory(data.items.map((item: { query: string }) => item.query))
    } catch (error) {
      console.error("Failed to load history:", error)
    }
  }, [isRegisteredUser])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownClosing(true)
        if (onFocusChange) {
          onFocusChange(false)
        }
        // Wait for animation to complete before removing from DOM
        setTimeout(() => {
          setShowDropdown(false)
          setIsDropdownClosing(false)
        }, 200)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onFocusChange])

  const saveToHistory = async (searchQuery: string) => {
    // Only save history for registered users
    if (!isRegisteredUser) {
      return
    }

    try {
      await api.post("/api/history", { query: searchQuery })
      loadHistory()
    } catch (error) {
      console.error("Failed to save to history:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Show suggestions from history (only for registered users)
    if (value.length > 0) {
      const filtered = history.filter((h) => h.toLowerCase().includes(value.toLowerCase()))
      setSuggestions(filtered.slice(0, 5))
      setShowDropdown(true)
      setIsDropdownClosing(false)
    } else {
      setIsDropdownClosing(true)
      setTimeout(() => setShowDropdown(false), 200)
    }
  }

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    saveToHistory(finalQuery)
    setQuery("")
    setIsDropdownClosing(true)
    setTimeout(() => setShowDropdown(false), 200)

    if (onSearch) {
      onSearch(finalQuery)
    } else {
      // Default: redirect to Google
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="relative w-full max-w-[600px]">
      <div className="flex items-center gap-2 bg-black backdrop-blur-[10px] p-2 rounded-xl border border-white/20">
        <img src={logoSrc} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            if (query) setShowDropdown(true)
            if (onFocusChange) onFocusChange(true)
          }}
          onBlur={() => {
            setIsFocused(false)
            if (!showDropdown && onFocusChange) {
              onFocusChange(false)
            }
          }}
          placeholder="Aske me..."
          className="flex-1 bg-transparent border-none p-0 text-base text-white outline-none placeholder-white/60"
        />
        {isFocused && (
          <button
            type="button"
            onClick={() => handleSearch()}
            className="shrink-0 p-2 text-white/80 hover:text-white rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search size={22} strokeWidth={2} />
          </button>
        )}
      </div>

      {showDropdown && (suggestions.length > 0 || (isRegisteredUser && history.length > 0)) && (
        <div
          ref={dropdownRef}
          className={`absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-black/90 backdrop-blur-[20px] rounded-lg border border-white/10 overflow-hidden z-[1000] max-h-[400px] overflow-y-auto ${
            isDropdownClosing ? "animate-dropdown-exit" : "animate-dropdown-enter"
          }`}
          style={{
            animationDuration: "200ms",
            animationFillMode: "forwards",
          }}
        >
          {query && suggestions.length > 0 ? (
            <div className="p-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-4 py-3 cursor-pointer rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 border-none bg-transparent"
                  onClick={() => handleSearch(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : isRegisteredUser && history.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-white/40 uppercase font-semibold tracking-wider">
                Recent
              </div>
              {history.slice(0, 5).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="w-full text-left px-4 py-3 cursor-pointer rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15 border-none bg-transparent"
                  onClick={() => handleSearch(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default AutocompleteInput
