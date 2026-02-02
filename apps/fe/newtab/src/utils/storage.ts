import type { ClockFormat } from "../components/Clock"
import {
  BACKGROUND_KEY,
  BACKGROUNDS,
  type BackgroundConfig,
  SEARCH_ENGINES,
  type SearchEngineId,
} from "../constants"

export const CLOCK_HIDDEN_KEY = "newtab-clock-hidden"
export const CLOCK_FORMAT_KEY = "newtab-clock-format"
export const SEARCH_ENGINE_KEY = "newtab-search-engine"

export const NEWS_VIEW_KEY = "news-view"

export type NewsViewMode = "list" | "featured"

export function readClockHidden(): boolean {
  try {
    const v = localStorage.getItem(CLOCK_HIDDEN_KEY)
    return v === "true"
  } catch {
    return false
  }
}

export function readClockFormat(): ClockFormat {
  try {
    const v = localStorage.getItem(CLOCK_FORMAT_KEY)
    if (v === "12h" || v === "24h" || v === "automatic") return v
  } catch {
    // ignore
  }
  return "automatic"
}

function defaultBackgroundConfig(): BackgroundConfig {
  return { type: "image", filename: BACKGROUNDS[0].filename }
}

export function readBackground(): BackgroundConfig {
  try {
    const v = localStorage.getItem(BACKGROUND_KEY)
    if (!v) return defaultBackgroundConfig()
    const parsed = JSON.parse(v) as unknown
    if (typeof parsed === "string") {
      const valid = BACKGROUNDS.some((b) => b.filename === parsed)
      if (valid) return { type: "image", filename: parsed }
      return defaultBackgroundConfig()
    }
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      const c = parsed as BackgroundConfig
      if (c.type === "image" && "filename" in c) {
        const valid = BACKGROUNDS.some((b) => b.filename === c.filename)
        if (valid) return c
      }
      if (c.type === "gradient" && "direction" in c && "color1" in c && "color2" in c) return c
      if (c.type === "solid" && "color" in c) return c
    }
  } catch {
    // ignore
  }
  return defaultBackgroundConfig()
}

export function writeBackground(config: BackgroundConfig): void {
  try {
    localStorage.setItem(BACKGROUND_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export function readSearchEngine(): SearchEngineId {
  try {
    const v = localStorage.getItem(SEARCH_ENGINE_KEY)
    if (v && SEARCH_ENGINES.some((e) => e.id === v)) return v as SearchEngineId
  } catch {
    // ignore
  }
  return "google"
}

export function writeSearchEngine(id: SearchEngineId): void {
  try {
    localStorage.setItem(SEARCH_ENGINE_KEY, id)
  } catch {
    // ignore
  }
}

export function readNewsView(): NewsViewMode {
  try {
    const v = localStorage.getItem(NEWS_VIEW_KEY)
    if (v === "list" || v === "featured") return v
  } catch {
    // ignore
  }
  return "list"
}

export function writeNewsView(view: NewsViewMode): void {
  try {
    localStorage.setItem(NEWS_VIEW_KEY, view)
  } catch {
    // ignore
  }
}
