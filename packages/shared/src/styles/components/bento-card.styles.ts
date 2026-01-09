/**
 * BentoCard shared styles.
 * Used by web StatCard and mobile BentoCard.
 */

import { hexColors } from "../../theme/colors";
import { oklchToHex } from "../../utils/color";

export const bentoCardStyles = {
  /** Container styles */
  container: {
    borderRadius: 16,
    minHeight: 160,
    padding: 16,
  },

  /** Border radius classes */
  borderRadiusClass: "rounded-2xl",

  /** Content layout */
  content: "flex flex-col justify-between h-full p-4",

  /** Header row with icon and chevron */
  header: "flex flex-row justify-between items-start",

  /** Icon container */
  iconContainer: "w-11 h-11 rounded-xl items-center justify-center flex",
  iconContainerHighlight: "bg-primary/20",
  iconContainerNormal: "bg-muted",

  /** Icon size */
  icon: "w-5 h-5",
  iconSize: 20,

  /** Chevron */
  chevron: "w-4 h-4 text-foreground-dim",
  chevronSize: 16,

  /** Value section */
  valueSection: "pt-5",
  value: "text-[28px] font-bold",
  valueHighlight: "text-foreground",
  valueNormal: "text-foreground",
  valueZero: "text-muted-foreground",
  label: "text-xs mt-0.5 text-muted-foreground",

  /** Non-highlight border */
  borderNormal: "border border-border-subtle",

  /** Gradient colors for highlight state (oklch strings) */
  gradients: {
    oklch: {
      borderStart: "oklch(0.5 0.18 260)",
      borderVia: "oklch(0.4 0.15 280)",
      bgStart: "oklch(0.22 0.08 260)",
      bgEnd: "oklch(0.14 0.04 280)",
      cardBg: "oklch(0.13 0.02 260)",
    },
  },

  /** Animation timing */
  animation: {
    /** Glow pulse duration in ms */
    glowDuration: 8000,
    /** Glow opacity range */
    glowOpacityMin: 0.03,
    glowOpacityMax: 0.08,
  },
} as const;

/**
 * Pre-computed hex colors for mobile (React Native doesn't support oklch).
 */
export const bentoCardHexColors = {
  borderStart: oklchToHex(bentoCardStyles.gradients.oklch.borderStart),
  borderVia: oklchToHex(bentoCardStyles.gradients.oklch.borderVia),
  bgStart: oklchToHex(bentoCardStyles.gradients.oklch.bgStart),
  bgEnd: oklchToHex(bentoCardStyles.gradients.oklch.bgEnd),
  cardBg: oklchToHex(bentoCardStyles.gradients.oklch.cardBg),
} as const;

/**
 * Get value text class based on highlight state and value.
 */
export function getBentoValueClass(highlight: boolean, value: number): string {
  if (value === 0) return bentoCardStyles.valueZero;
  return highlight ? bentoCardStyles.valueHighlight : bentoCardStyles.valueNormal;
}

/**
 * Get icon container class based on highlight state.
 */
export function getBentoIconContainerClass(highlight: boolean): string {
  return `${bentoCardStyles.iconContainer} ${highlight ? bentoCardStyles.iconContainerHighlight : bentoCardStyles.iconContainerNormal}`;
}
