import { differenceInDays, format, formatDistanceToNow } from "date-fns"

const CUTOFF_DAYS = 3
const ABSOLUTE_FORMAT = "MMM d, yyyy"

/**
 * Formats a date for article display: relative time (e.g. "2 hours ago") if
 * within the last 3 days, otherwise absolute date (e.g. "Jan 15, 2025").
 */
export function formatArticleDate(
  date: Date | string | number,
  options?: { cutoffDays?: number; absoluteFormat?: string }
): string {
  const d = typeof date === "object" && date instanceof Date ? date : new Date(date)
  const cutoff = options?.cutoffDays ?? CUTOFF_DAYS
  const formatStr = options?.absoluteFormat ?? ABSOLUTE_FORMAT

  if (differenceInDays(Date.now(), d) > cutoff) {
    return format(d, formatStr)
  }
  return formatDistanceToNow(d, { addSuffix: true })
}
