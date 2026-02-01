export const BACKGROUND_KEY = "newtab-background"

export type BackgroundType = "image" | "gradient" | "solid"

export const BACKGROUNDS = [
  { id: "da-nang", filename: "da-nang-bg.png", label: "Da Nang" },
  { id: "ha-giang", filename: "ha-giang-bg.png", label: "Ha Giang" },
  { id: "ha-long", filename: "ha-long-bg.png", label: "Ha Long Bay" },
  { id: "ha-noi", filename: "ha-noi-bg.png", label: "Ha Noi" },
  { id: "ho-chi-minh", filename: "ho-chi-ming-bg.png", label: "Ho Chi Minh" },
] as const

/** Linear gradient direction → CSS value */
export const GRADIENT_DIRECTIONS = [
  { id: "to-b", value: "to bottom", label: "Top to bottom" },
  { id: "to-t", value: "to top", label: "Bottom to top" },
  { id: "to-r", value: "to right", label: "Left to right" },
  { id: "to-l", value: "to left", label: "Right to left" },
  { id: "to-br", value: "to bottom right", label: "Top-left to bottom-right" },
  { id: "to-bl", value: "to bottom left", label: "Top-right to bottom-left" },
  { id: "to-tr", value: "to top right", label: "Bottom-left to top-right" },
  { id: "to-tl", value: "to top left", label: "Bottom-right to top-left" },
] as const

/** Preset gradients: [color1, color2] */
export const GRADIENT_PRESETS = [
  { id: "sunset", label: "Sunset", color1: "#f97316", color2: "#7c2d12" },
  { id: "ocean", label: "Ocean", color1: "#0ea5e9", color2: "#0c4a6e" },
  { id: "forest", label: "Forest", color1: "#22c55e", color2: "#14532d" },
  { id: "lavender", label: "Lavender", color1: "#a78bfa", color2: "#4c1d95" },
  { id: "midnight", label: "Midnight", color1: "#1e293b", color2: "#0f172a" },
  { id: "ember", label: "Ember", color1: "#fbbf24", color2: "#b91c1c" },
  { id: "mint", label: "Mint", color1: "#34d399", color2: "#064e3b" },
  { id: "rose", label: "Rose", color1: "#fb7185", color2: "#881337" },
] as const

/** Preset solid colors */
export const SOLID_PRESETS = [
  { id: "slate", label: "Slate", color: "#64748b" },
  { id: "navy", label: "Navy", color: "#1e3a5f" },
  { id: "charcoal", label: "Charcoal", color: "#334155" },
  { id: "ink", label: "Ink", color: "#0f172a" },
  { id: "white", label: "White", color: "#f8fafc" },
  { id: "indigo", label: "Indigo", color: "#4338ca" },
  { id: "teal", label: "Teal", color: "#0f766e" },
  { id: "amber", label: "Amber", color: "#b45309" },
] as const

export type BackgroundConfig =
  | { type: "image"; filename: string }
  | { type: "gradient"; direction: string; color1: string; color2: string }
  | { type: "solid"; color: string }

/** Search engines for autocomplete bar. {q} is replaced with the query. */
export const SEARCH_ENGINES = [
  { id: "google", label: "Google", urlTemplate: "https://www.google.com/search?q={q}" },
  { id: "brave", label: "Brave", urlTemplate: "https://search.brave.com/search?q={q}" },
  { id: "duckduckgo", label: "DuckDuckGo", urlTemplate: "https://duckduckgo.com/?q={q}" },
  { id: "bing", label: "Bing", urlTemplate: "https://www.bing.com/search?q={q}" },
] as const

export type SearchEngineId = (typeof SEARCH_ENGINES)[number]["id"]
