import type { ClockFormat } from "../components/Clock"
import { BACKGROUND_KEY, BACKGROUNDS } from "../constants"

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

export function readBackground(): string {
    try {
        const v = localStorage.getItem(BACKGROUND_KEY)
        const valid = BACKGROUNDS.some((b) => b.filename === v)
        if (valid && v) return v
    } catch {
        // ignore
    }
    return BACKGROUNDS[0].filename
}
