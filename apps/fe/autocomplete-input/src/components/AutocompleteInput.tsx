import { useState, useEffect, useRef } from 'react'

interface AutocompleteInputProps {
  onSearch?: (query: string) => void
}

function AutocompleteInput({ onSearch }: AutocompleteInputProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('http://localhost:8082/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.items.map((item: { query: string }) => item.query))
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const saveToHistory = async (searchQuery: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      await fetch('http://localhost:8082/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      loadHistory()
    } catch (error) {
      console.error('Failed to save to history:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Show suggestions from history
    if (value.length > 0) {
      const filtered = history.filter((h) =>
        h.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    saveToHistory(finalQuery)
    setQuery('')
    setShowDropdown(false)

    if (onSearch) {
      onSearch(finalQuery)
    } else {
      // Default: redirect to Google
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="relative w-full max-w-[600px]">
      <div className="flex gap-2 bg-white/10 backdrop-blur-[10px] p-2 rounded-xl border border-white/20">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowDropdown(true)}
          placeholder="Search web..."
          className="flex-1 bg-transparent border-none px-4 py-3 text-base text-white outline-none placeholder-white/60"
        />
        <button
          onClick={() => handleSearch()}
          className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white border-none rounded-lg cursor-pointer text-base font-semibold transition-all hover:-translate-y-px hover:shadow-lg active:translate-y-0"
          style={{
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
        >
          Search
        </button>
      </div>

      {showDropdown && (suggestions.length > 0 || history.length > 0) && (
        <div ref={dropdownRef} className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-black/90 backdrop-blur-[20px] rounded-lg border border-white/10 overflow-hidden z-[1000] max-h-[400px] overflow-y-auto">
          {query && suggestions.length > 0 ? (
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-3 cursor-pointer rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15"
                  onClick={() => handleSearch(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-white/40 uppercase font-semibold tracking-wider">
                Recent
              </div>
              {history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-3 cursor-pointer rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/15"
                  onClick={() => handleSearch(item)}
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AutocompleteInput
