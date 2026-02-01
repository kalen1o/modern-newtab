import type { ClockFormat } from "../components/Clock"
import { BACKGROUND_KEY, BACKGROUNDS, type BackgroundConfig } from "../constants"

export const CLOCK_HIDDEN_KEY = "newtab-clock-hidden"
export const CLOCK_FORMAT_KEY = "newtab-clock-format"

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
            if (c.type === "gradient" && "direction" in c && "color1" in c && "color2" in c)
                return c
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
