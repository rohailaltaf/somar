/**
 * Demo banner shared styles.
 * Used by demo banner components on both web and mobile.
 */

import { oklchToHex } from "../../utils/color";

/** Oklch color definitions (source of truth) */
const demoOklchColors = {
  // Warning yellow background
  background: "oklch(0.92 0.12 90)",
  // Dark text for contrast
  text: "oklch(0.30 0.08 85)",
  // Subtle darker for secondary text
  textSecondary: "oklch(0.45 0.06 85)",
  // Button hover
  buttonHover: "oklch(0.88 0.14 90)",
  // Icon color
  icon: "oklch(0.50 0.15 45)",
} as const;

/** Computed hex colors for mobile */
const demoHexColors = {
  background: oklchToHex(demoOklchColors.background),
  text: oklchToHex(demoOklchColors.text),
  textSecondary: oklchToHex(demoOklchColors.textSecondary),
  buttonHover: oklchToHex(demoOklchColors.buttonHover),
  icon: oklchToHex(demoOklchColors.icon),
} as const;

export interface DemoBannerProps {
  onExit: () => void;
}

export const demoBannerStyles = {
  /** Main container */
  container: "flex flex-row items-center justify-between py-2 px-4",

  /** Content section */
  content: "flex flex-row items-center gap-2",

  /** Icon wrapper */
  iconWrapper: "flex items-center justify-center",

  /** Text styles */
  text: "font-medium text-sm",
  subtext: "text-xs opacity-80",

  /** Exit button */
  exitButton: "flex flex-row items-center gap-1 py-1 px-2 rounded-md transition-colors",
  exitButtonText: "text-xs font-medium",

  /** Numeric values */
  heights: {
    banner: 40,
  },

  dimensions: {
    iconSize: 16,
    exitIconSize: 14,
  },

  /** Color values (oklch for web, hex for mobile) */
  colors: {
    oklch: demoOklchColors,
    hex: demoHexColors,
  },
} as const;
