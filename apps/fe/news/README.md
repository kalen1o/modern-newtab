# News Microservice

A React microfrontend that displays news articles with grid layout and image support.

## Features

- Fetches news articles from backend API
- Responsive grid layout
- Image support for articles
- Source and date display
- Error handling with retry
- Loading states

## Development

```bash
pnpm install
pnpm run dev
```

Runs on port 5002.

## Module Federation

This module exposes a `News` component via module federation at `/remoteEntry.js`.

Usage in host app:

```tsx
const NewsModule = lazy(() =>
  import('news/News').then((module) => ({
    default: module.News,
  }))
)
```

## API Integration

- Endpoint: `http://localhost:8082/api/news`
- Returns: `{ articles: NewsArticle[] }`
- Authentication: Bearer token from localStorage (if available)
