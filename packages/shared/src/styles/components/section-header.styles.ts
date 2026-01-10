/**
 * SectionHeader shared styles.
 * Used by both web and mobile implementations.
 */

export const sectionHeaderStyles = {
  /** Dashboard section header */
  dashboard: {
    /** Container - flex row with space between */
    container: "flex flex-row justify-between items-start",

    /** Title section */
    titleContainer: "flex flex-col",
    title: "font-semibold text-lg text-foreground",
    subtitle: "text-[13px] text-muted-foreground mt-0.5",

    /** Action button section */
    actionContainer: "flex flex-row items-center",
    actionLabel: "font-medium text-[13px] text-muted-foreground mr-1",
    actionChevron: "w-3.5 h-3.5 text-muted-foreground",
    actionChevronSize: 14,
  },

  /** Date section header */
  date: {
    /** Container with background */
    container: "px-5 py-3 bg-surface border-b border-border-subtle",

    /** Row layout */
    row: "flex flex-row items-baseline justify-between",

    /** Primary date text (e.g., "Today", "Monday") */
    primaryContainer: "flex flex-row items-baseline",
    primary: "text-sm font-semibold text-foreground",

    /** Secondary date text (e.g., "January 15") */
    secondary: "text-sm text-muted-foreground ml-2",

    /** Day total amount */
    amount: "text-sm font-medium",
  },

  /** Generic section header */
  generic: {
    container: "flex flex-row justify-between items-center",
    title: "font-semibold text-foreground",
    titleSm: "text-base",
    titleDefault: "text-lg",
    titleLg: "text-xl",
    subtitle: "text-sm text-muted-foreground mt-1",
  },
} as const;

/**
 * Get title class based on size.
 */
export function getSectionTitleClass(size: "sm" | "default" | "lg" = "default"): string {
  const { generic } = sectionHeaderStyles;
  const sizeClass = size === "sm"
    ? generic.titleSm
    : size === "lg"
      ? generic.titleLg
      : generic.titleDefault;
  return `${generic.title} ${sizeClass}`;
}
