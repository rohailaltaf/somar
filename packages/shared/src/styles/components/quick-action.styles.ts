import { hexColors } from "../../theme/colors";

/**
 * QuickAction shared styles.
 * Used by both web and mobile implementations.
 */

export const quickActionStyles = {
  /** Base container - applies to both platforms */
  container: "rounded-2xl p-4 border active:scale-[0.98]",

  /** Container variants */
  containerHighlight: "bg-primary/20",
  /** Border color for highlight state - primary with 50% opacity */
  containerHighlightBorder: `${hexColors.primary}80`,
  containerNormal: "bg-background border-border-subtle",

  /** Flex layout for content */
  content: "flex flex-row items-center gap-3",

  /** Icon container */
  iconContainer: "p-2 rounded-lg",
  iconContainerHighlight: "bg-primary/30",
  iconContainerNormal: "bg-surface-elevated",

  /** Icon sizing */
  icon: "w-4 h-4",
  iconSize: 16,

  /** Icon colors */
  iconHighlight: "text-primary",
  iconNormal: "text-muted-foreground",

  /** Text styles */
  label: "text-sm font-medium",
  labelHighlight: "text-foreground",
  labelNormal: "text-foreground-secondary",

  sublabel: "text-xs text-muted-foreground",
} as const;

/**
 * Get container className based on highlight state.
 */
export function getQuickActionContainerClass(highlight: boolean): string {
  return `${quickActionStyles.container} ${
    highlight ? quickActionStyles.containerHighlight : quickActionStyles.containerNormal
  }`;
}

/**
 * Get icon container className based on highlight state.
 */
export function getQuickActionIconContainerClass(highlight: boolean): string {
  return `${quickActionStyles.iconContainer} ${
    highlight ? quickActionStyles.iconContainerHighlight : quickActionStyles.iconContainerNormal
  }`;
}

/**
 * Get icon className based on highlight state.
 */
export function getQuickActionIconClass(highlight: boolean): string {
  return `${quickActionStyles.icon} ${
    highlight ? quickActionStyles.iconHighlight : quickActionStyles.iconNormal
  }`;
}

/**
 * Get label className based on highlight state.
 */
export function getQuickActionLabelClass(highlight: boolean): string {
  return `${quickActionStyles.label} ${
    highlight ? quickActionStyles.labelHighlight : quickActionStyles.labelNormal
  }`;
}
