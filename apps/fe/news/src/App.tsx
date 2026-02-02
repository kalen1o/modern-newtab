import { useState } from "react"
import NewsGrid from "./components/NewsGrid"
import type { NewsViewMode } from "./components/NewsGrid"

const NEWS_VIEW_KEY = "news-view"

const App = () => {
  const [newsView, setNewsView] = useState<NewsViewMode>(() => {
    const stored = localStorage.getItem(NEWS_VIEW_KEY)
    return stored === "featured" || stored === "list" ? stored : "list"
  })

  const handleNewsViewChange = (view: NewsViewMode) => {
    setNewsView(view)
    localStorage.setItem(NEWS_VIEW_KEY, view)
  }

  return (
    <div>
      <NewsGrid newsView={newsView} onNewsViewChange={handleNewsViewChange} />
    </div>
  )
}

export default App
