import { parseISO, isValid } from "date-fns";

/**
 * Parse a date string safely. Returns null for empty/invalid strings or Invalid Date.
 * Use before isPast/isFuture/format to avoid RangeError: Invalid time value.
 */
export function safeParseISO(value: string | null | undefined): Date | null {
  if (value == null || String(value).trim() === "") return null;
  try {
    const d = parseISO(String(value).trim());
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}
