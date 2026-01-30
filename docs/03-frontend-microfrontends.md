# Phase 3: Frontend Microfrontends Setup

## Overview

This phase covers setting up React + Vite applications with module federation for microfrontend architecture.

## 3.1 Vite Plugin Federation Configuration

### Overview

Module federation allows sharing React components and dependencies between applications at runtime. We'll use `@originjs/vite-plugin-federation`.

### Installation

```bash
# Install federation plugin in each FE app
cd apps/fe/newtab
pnpm add -D @originjs/vite-plugin-federation

cd ../autocomplete-input
pnpm add -D @originjs/vite-plugin-federation

cd ../news
pnpm add -D @originjs/vite-plugin-federation

cd ../sponsor-admin
pnpm add -D @originjs/vite-plugin-federation
```

### Root Workspace Configuration

**File:** `/package.json` (update scripts)

```json
{
  "scripts": {
    "dev": "nx run-many -t serve -p newtab-shell autocomplete-input news",
    "dev:shell": "nx run newtab:serve",
    "dev:autocomplete": "nx run autocomplete-input:serve",
    "dev:news": "nx run news:serve",
    "dev:admin": "nx run sponsor-admin:serve",
    "build": "nx run-many -t build -p newtab-shell autocomplete-input news"
  }
}
```

## 3.2 NewTab Shell App (apps/fe/newtab)

### Purpose

Host shell that composes microfrontends, displays sponsor backgrounds, news grid, and settings.

### Directory Structure

```
apps/fe/newtab/
├── src/
│   ├── components/
│   │   ├── SponsorBackground.tsx
│   │   ├── NewsScrollGrid.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── Layout.tsx
│   ├── api/
│   │   ├── sponsors.ts
│   │   ├── news.ts
│   │   ├── preferences.ts
│   │   └── auth.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── sponsor.ts
│   │   ├── news.ts
│   │   └── preferences.ts
│   ├── hooks/
│   │   ├── useSponsor.ts
│   │   ├── useNews.ts
│   │   └── useTheme.ts
│   ├── utils/
│   │   └── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### Step 1: Update vite.config.ts with Federation

**File:** `/apps/fe/newtab/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'newtab-shell',
      remotes: {
        autocomplete: 'http://localhost:5001/assets/remoteEntry.js',
        news: 'http://localhost:5002/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    cors: true,
  },
})
```

### Step 2: Create Types

**File:** `/apps/fe/newtab/src/types/index.ts`

```typescript
export interface Sponsor {
  id: number
  name: string
  type: 'image' | 'video'
  mediaUrl: string
  linkUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SponsorSettings {
  id: number
  rotationStrategy: 'random' | 'sequential'
  displayDuration: number
  updatedAt: string
}

export interface NewsArticle {
  id: number
  title: string
  description: string
  url: string
  source?: string
  publishedAt?: string
  createdAt: string
}

export interface UserPreferences {
  id: number
  userId?: number
  theme: 'light' | 'dark' | 'auto'
  backgroundType: 'image' | 'video'
  showNews: boolean
  showSponsors: boolean
  showHistory: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchHistoryItem {
  id: number
  userId?: number
  query: string
  createdAt: string
}
```

### Step 3: Create API Utility

**File:** `/apps/fe/newtab/src/utils/api.ts`

```typescript
const API_BASE = 'http://localhost:8082'
const AUTH_API = 'http://localhost:8081'

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T>(url: string, data: unknown) =>
    apiRequest<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) =>
    apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
}
```

### Step 4: Create Sponsor Background Component

**File:** `/apps/fe/newtab/src/components/SponsorBackground.tsx`

```typescript
import { useState, useEffect } from 'react'
import { Sponsor } from '../types'
import { api } from '../utils/api'

export function SponsorBackground() {
  const [sponsor, setSponsor] = useState<Sponsor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSponsor()
  }, [])

  const loadSponsor = async () => {
    try {
      const data = await api.get<{ sponsor: Sponsor }>(
        `${API_BASE}/api/sponsors/random`
      )
      setSponsor(data.sponsor)
    } catch (error) {
      console.error('Failed to load sponsor:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !sponsor) {
    return (
      <div className="sponsor-background sponsor-background--loading">
        <div className="sponsor-background__placeholder" />
      </div>
    )
  }

  return (
    <a
      href={sponsor.linkUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="sponsor-background"
    >
      {sponsor.type === 'video' ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="sponsor-background__media"
        >
          <source src={sponsor.mediaUrl} type="video/mp4" />
        </video>
      ) : (
        <img
          src={sponsor.mediaUrl}
          alt={sponsor.name}
          className="sponsor-background__media"
        />
      )}
      <div className="sponsor-background__overlay" />
    </a>
  )
}
```

### Step 5: Create News Scroll Grid Component

**File:** `/apps/fe/newtab/src/components/NewsScrollGrid.tsx`

```typescript
import { useState, useEffect } from 'react'
import { NewsArticle } from '../types'
import { api } from '../utils/api'

export function NewsScrollGrid() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const data = await api.get<{ articles: NewsArticle[] }>(
        `${API_BASE}/api/news`
      )
      setArticles(data.articles)
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="news-grid news-grid--loading">Loading news...</div>
  }

  return (
    <div className="news-grid">
      {articles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-grid__item"
        >
          <div className="news-grid__source">{article.source || 'News'}</div>
          <h3 className="news-grid__title">{article.title}</h3>
          {article.description && (
            <p className="news-grid__description">{article.description}</p>
          )}
        </a>
      ))}
    </div>
  )
}
```

### Step 6: Create Settings Modal Component

**File:** `/apps/fe/newtab/src/components/SettingsModal.tsx`

```typescript
import { useState, useEffect } from 'react'
import { UserPreferences } from '../types'
import { api } from '../utils/api'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) loadPreferences()
  }, [isOpen])

  const loadPreferences = async () => {
    try {
      const data = await api.get<UserPreferences>(
        `${API_BASE}/api/preferences`
      )
      setPreferences(data)
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

  const savePreferences = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      await api.put(`${API_BASE}/api/preferences`, preferences)
      onClose()
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value })
    }
  }

  if (!isOpen || !preferences) return null

  return (
    <div className="settings-modal">
      <div className="settings-modal__overlay" onClick={onClose} />
      <div className="settings-modal__content">
        <h2>Settings</h2>

        <div className="settings-modal__section">
          <h3>Theme</h3>
          <select
            value={preferences.theme}
            onChange={(e) =>
              updatePreference('theme', e.target.value as 'light' | 'dark' | 'auto')
            }
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="settings-modal__section">
          <h3>Visibility</h3>
          <label>
            <input
              type="checkbox"
              checked={preferences.showNews}
              onChange={(e) => updatePreference('showNews', e.target.checked)}
            />
            Show News
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.showSponsors}
              onChange={(e) => updatePreference('showSponsors', e.target.checked)}
            />
            Show Sponsors
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.showHistory}
              onChange={(e) => updatePreference('showHistory', e.target.checked)}
            />
            Show Search History
          </label>
        </div>

        <div className="settings-modal__actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={savePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Step 7: Update Main App Component

**File:** `/apps/fe/newtab/src/App.tsx`

```typescript
import { useState, lazy, Suspense } from 'react'
import { SponsorBackground } from './components/SponsorBackground'
import { NewsScrollGrid } from './components/NewsScrollGrid'
import { SettingsModal } from './components/SettingsModal'

const AutocompleteModule = lazy(() =>
  import('autocomplete/Autocomplete').then((module) => ({
    default: module.Autocomplete,
  }))
)

const NewsModule = lazy(() =>
  import('news/News').then((module) => ({
    default: module.News,
  }))
)

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="app">
      <SponsorBackground />

      <div className="app__content">
        <header className="app__header">
          <h1>NewTab</h1>
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
        </header>

        <main className="app__main">
          <Suspense fallback={<div>Loading...</div>}>
            <AutocompleteModule />
          </Suspense>
        </main>

        <aside className="app__sidebar">
          <Suspense fallback={<div>Loading news...</div>}>
            <NewsModule />
          </Suspense>
        </aside>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
```

## 3.3 Autocomplete Input Module (apps/fe/autocomplete-input)

### Purpose

Remote module providing search input with autocomplete and history.

### Directory Structure

```
apps/fe/autocomplete-input/
├── src/
│   ├── components/
│   │   └── AutocompleteInput.tsx
│   ├── api/
│   │   └── history.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx (exported component)
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### Step 1: Update vite.config.ts with Federation

**File:** `/apps/fe/autocomplete-input/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'autocomplete',
      filename: 'remoteEntry.js',
      exposes: {
        './Autocomplete': './src/App.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5001,
    cors: true,
  },
})
```

### Step 2: Create Autocomplete Input Component

**File:** `/apps/fe/autocomplete-input/src/components/AutocompleteInput.tsx`

```typescript
import { useState, useEffect, useRef } from 'react'

interface AutocompleteInputProps {
  onSearch?: (query: string) => void
}

export function AutocompleteInput({ onSearch }: AutocompleteInputProps) {
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
    <div className="autocomplete-input">
      <div className="autocomplete-input__container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowDropdown(true)}
          placeholder="Search the web..."
          className="autocomplete-input__field"
        />
        <button
          onClick={() => handleSearch()}
          className="autocomplete-input__button"
        >
          Search
        </button>
      </div>

      {showDropdown && (suggestions.length > 0 || history.length > 0) && (
        <div ref={dropdownRef} className="autocomplete-input__dropdown">
          {query && suggestions.length > 0 ? (
            <div className="autocomplete-input__suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="autocomplete-input__suggestion"
                  onClick={() => handleSearch(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          ) : (
            <div className="autocomplete-input__history">
              <div className="autocomplete-input__history-title">Recent</div>
              {history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="autocomplete-input__history-item"
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
```

### Step 3: Update Main App (Export Component)

**File:** `/apps/fe/autocomplete-input/src/App.tsx`

```typescript
import { AutocompleteInput } from './components/AutocompleteInput'

export { AutocompleteInput }
export function Autocomplete() {
  return <AutocompleteInput />
}
```

## 3.4 News Module (apps/fe/news)

### Purpose

Remote module providing news grid display with API integration and responsive layout.

### Directory Structure

```
apps/fe/news/
├── src/
│   ├── components/
│   │   └── NewsGrid.tsx
│   ├── api/
│   │   └── news.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx (exported component)
│   ├── main.tsx
│   ├── App.css
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### Step 1: Update vite.config.ts with Federation

**File:** `/apps/fe/news/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    federation({
      name: 'news',
      filename: 'remoteEntry.js',
      exposes: {
        './News': './src/App.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5002,
    cors: true,
  },
})
```

### Step 2: Create Types

**File:** `/apps/fe/news/src/types/index.ts`

```typescript
export interface NewsArticle {
  id: number
  title: string
  description: string
  url: string
  source?: string
  publishedAt?: string
  imageUrl?: string
  createdAt: string
}
```

### Step 3: Create API Utility

**File:** `/apps/fe/news/src/api/news.ts`

```typescript
const API_BASE = 'http://localhost:8082'

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const newsApi = {
  get: <T>(url: string) => apiRequest<T>(url, { method: 'GET' }),
}
```

### Step 4: Create News Grid Component

**File:** `/apps/fe/news/src/components/NewsGrid.tsx`

```typescript
import { useState, useEffect } from 'react'
import { NewsArticle } from '../types'
import { newsApi } from '../api/news'

export function NewsGrid() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const data = await newsApi.get<{ articles: NewsArticle[] }>(
        `${API_BASE}/api/news`
      )
      setArticles(data.articles)
      setError(null)
    } catch (error) {
      console.error('Failed to load news:', error)
      setError('Failed to load news articles')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="news-grid news-grid--loading">
        <div className="news-grid__loader">Loading news...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="news-grid news-grid--error">
        <div className="news-grid__error">{error}</div>
        <button onClick={loadNews} className="news-grid__retry">
          Retry
        </button>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="news-grid news-grid--empty">
        <div className="news-grid__empty">No news articles available</div>
      </div>
    )
  }

  return (
    <div className="news-grid">
      {articles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-grid__item"
        >
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="news-grid__image"
            />
          )}
          <div className="news-grid__content">
            {article.source && (
              <div className="news-grid__source">{article.source}</div>
            )}
            <h3 className="news-grid__title">{article.title}</h3>
            {article.description && (
              <p className="news-grid__description">{article.description}</p>
            )}
            {article.publishedAt && (
              <div className="news-grid__date">
                {new Date(article.publishedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}
```

### Step 5: Update Main App (Export Component)

**File:** `/apps/fe/news/src/App.tsx`

```typescript
import { NewsGrid } from './components/NewsGrid'

export { NewsGrid }
export function News() {
  return <NewsGrid />
}
```

## 3.5 Sponsor Admin App (apps/fe/sponsor-admin)

### Purpose

Admin interface for sponsor CRUD operations and rotation settings.

### Directory Structure

```
apps/fe/sponsor-admin/
├── src/
│   ├── components/
│   │   ├── SponsorForm.tsx
│   │   ├── SponsorList.tsx
│   │   └── SettingsForm.tsx
│   ├── api/
│   │   └── sponsors.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── package.json
└── tsconfig.json
```

### Implementation

Similar pattern to other apps with:
- Form for creating/updating sponsors
- List view of all sponsors
- Edit/delete actions
- Rotation strategy configuration
- Display duration settings

## Verification Checklist

After completing Phase 3:

- [ ] `@originjs/vite-plugin-federation` installed in all FE apps
- [ ] NewTab shell vite.config.ts configured as federation host
- [ ] Autocomplete vite.config.ts configured as federation remote
- [ ] News vite.config.ts configured as federation remote
- [ ] Sponsor admin vite.config.ts configured as standalone app
- [ ] SponsorBackground component created
- [ ] NewsGrid component created
- [ ] SettingsModal component created
- [ ] AutocompleteInput component created and exported
- [ ] NewsModule component created and exported
- [ ] Shell app loads remote modules successfully
- [ ] All apps can run concurrently on different ports
- [ ] API integration points created

## Testing

### Start All FE Apps

```bash
# Terminal 1: Shell
pnpm run dev:shell

# Terminal 2: Autocomplete
pnpm run dev:autocomplete

# Terminal 3: News
pnpm run dev:news

# Terminal 4: Admin
pnpm run dev:admin
```

### Verify Federation

1. Open http://localhost:5173
2. Check that autocomplete module loads
3. Check that news module loads
4. Verify no console errors about remote entries

## Next Steps

Proceed to [Phase 4: Nginx Configuration](./04-nginx-configuration.md)
