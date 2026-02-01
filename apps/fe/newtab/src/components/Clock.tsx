import { useEffect, useState } from "react"

export type ClockFormat = "automatic" | "12h" | "24h"

export type ClockProps = {
  hidden: boolean
  format: ClockFormat
  className?: string
}

function formatTime(format: ClockFormat): string {
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  }
  if (format === "12h") {
    opts.hour12 = true
  } else if (format === "24h") {
    opts.hour12 = false
  }
  return new Intl.DateTimeFormat(undefined, opts).format(now)
}

export function Clock({ hidden, format, className = "" }: ClockProps) {
  const [time, setTime] = useState(() => formatTime(format))

  useEffect(() => {
    if (hidden) return
    setTime(formatTime(format))
    const id = setInterval(() => setTime(formatTime(format)), 60_000)
    return () => clearInterval(id)
  }, [hidden, format])

  const now = new Date()
  return (
    <time
      dateTime={now.toISOString()}
      className={`text-5xl font-bold tabular-nums text-white ${className}`}
      style={{
        textShadow: "0 1px 2px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.3)",
        visibility: hidden ? "hidden" : "visible",
      }}
      aria-live="polite"
      aria-hidden={hidden}
    >
      {time}
    </time>
  )
}
