/**
 * Date utilities shared across web and mobile apps.
 * All month strings use YYYY-MM format.
 * All date strings use YYYY-MM-DD format.
 */

/**
 * Parse a YYYY-MM-DD string into a Date object in local time.
 * Avoids timezone issues that occur with `new Date("YYYY-MM-DD")`.
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date object as YYYY-MM-DD string.
 * Avoids timezone issues that occur with `toISOString().split("T")[0]`.
 */
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Get current month in YYYY-MM format.
 */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get date range for a month string (YYYY-MM).
 * Returns startDate (first day) and endDate (last day) in YYYY-MM-DD format.
 */
export function getMonthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

/**
 * Get previous month in YYYY-MM format.
 * @param month - Optional month string (YYYY-MM). If not provided, uses current month.
 */
export function getPreviousMonth(month?: string): string {
  if (month) {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Format month string for display (e.g., "January 2024").
 * Uses local time to avoid timezone issues.
 */
export function formatMonth(month: string): string {
  // Append T00:00:00 to force local time interpretation (date-only strings are UTC)
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Calculate percentage change between two values.
 * @returns Percentage change rounded to nearest integer, or null if previous is 0.
 */
export function getPercentageChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get date N days ago in YYYY-MM-DD format.
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateString(date);
}

/**
 * Format currency for display.
 * @param amount - The amount to format
 * @param showCents - Whether to show decimal places (default: false)
 */
export function formatCurrency(amount: number, showCents: boolean = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}

export interface FormatDateOptions {
  /** Include weekday (e.g., "Mon, Dec 15") */
  weekday?: boolean;
  /** Show relative labels ("Today", "Yesterday") when applicable */
  relative?: boolean;
  /** Control year display: "auto" shows year if different from current, "always"/"never" force behavior */
  showYear?: "auto" | "always" | "never";
}

/**
 * Format a YYYY-MM-DD date string for display.
 * Uses timezone-safe parsing to avoid day shifts.
 */
export function formatDate(dateStr: string, options: FormatDateOptions = {}): string {
  const { weekday = false, relative = false, showYear = "auto" } = options;

  // Parse YYYY-MM-DD without timezone conversion
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Handle relative dates
  if (relative) {
    const transactionDate = new Date(year, month - 1, day);
    transactionDate.setHours(0, 0, 0, 0);

    if (transactionDate.getTime() === today.getTime()) {
      return "Today";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (transactionDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
  }

  // Determine if year should be shown
  const includeYear =
    showYear === "always" ||
    (showYear === "auto" && year !== today.getFullYear());

  // Build format options
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  if (weekday) {
    formatOptions.weekday = "short";
  }

  if (includeYear) {
    formatOptions.year = "numeric";
  }

  return date.toLocaleDateString("en-US", formatOptions);
}
