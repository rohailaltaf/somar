/**
 * Date section formatting hook.
 *
 * Provides formatted date strings for section headers:
 * - Relative dates (Today, Yesterday)
 * - Day of week
 * - Month and day
 * - Year handling for dates in different years
 *
 * Used by mobile's DateSectionHeader and can be used by web for grouping.
 */

export interface DateSectionResult {
  /** Primary label: "Today", "Yesterday", or day of week */
  primary: string;
  /** Secondary label: month and day (e.g., "January 15") */
  secondary: string;
  /** Full formatted date for display */
  formatted: string;
  /** Whether this is today */
  isToday: boolean;
  /** Whether this is yesterday */
  isYesterday: boolean;
  /** Day of week (e.g., "Monday") */
  dayOfWeek: string;
  /** Month and day (e.g., "January 15") */
  monthDay: string;
  /** Year if different from current year */
  year: number | null;
}

/**
 * Format a date string for section header display.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Object with all formatted date values
 *
 * @example
 * ```tsx
 * // Mobile usage
 * const { primary, secondary, isToday } = useDateSection("2025-01-15");
 * <View>
 *   <Text className="font-semibold">{primary}</Text>
 *   <Text className="text-muted-foreground">{secondary}</Text>
 * </View>
 *
 * // Web usage for grouping
 * const { primary, secondary } = useDateSection(transaction.date);
 * ```
 */
export function useDateSection(dateString: string): DateSectionResult {
  // Parse date without timezone issues
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Get today and yesterday for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const transactionDate = new Date(year, month - 1, day);
  transactionDate.setHours(0, 0, 0, 0);

  // Check relative dates
  const isToday = transactionDate.getTime() === today.getTime();
  const isYesterday = transactionDate.getTime() === yesterday.getTime();

  // Format components
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  // Determine if we need to show year
  const currentYear = today.getFullYear();
  const isDifferentYear = year !== currentYear;
  const displayYear = isDifferentYear ? year : null;

  // Build primary and secondary labels
  let primary: string;
  let secondary: string;

  if (isToday) {
    primary = "Today";
    secondary = monthDay;
  } else if (isYesterday) {
    primary = "Yesterday";
    secondary = monthDay;
  } else {
    primary = dayOfWeek;
    secondary = isDifferentYear
      ? date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : monthDay;
  }

  // Full formatted string
  const formatted = isDifferentYear
    ? date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });

  return {
    primary,
    secondary,
    formatted,
    isToday,
    isYesterday,
    dayOfWeek,
    monthDay,
    year: displayYear,
  };
}

/**
 * Group an array of items by date.
 *
 * @param items - Array of items with a date property
 * @param getDate - Function to extract date string from item
 * @returns Array of groups with date info and items
 *
 * @example
 * ```tsx
 * const groups = groupByDate(transactions, (tx) => tx.date);
 * groups.forEach(({ dateInfo, items }) => {
 *   console.log(dateInfo.primary, items.length);
 * });
 * ```
 */
export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string
): Array<{ date: string; dateInfo: DateSectionResult; items: T[] }> {
  const groups = new Map<string, T[]>();

  // Group items by date
  for (const item of items) {
    const date = getDate(item);
    const existing = groups.get(date);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(date, [item]);
    }
  }

  // Convert to array with date info
  return Array.from(groups.entries()).map(([date, groupItems]) => ({
    date,
    dateInfo: useDateSection(date),
    items: groupItems,
  }));
}
