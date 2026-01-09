/**
 * HeroCard shared styles.
 * Used by both web and mobile implementations.
 */

import { hexColors } from "../../theme/colors";
import { oklchToHex } from "../../utils/color";

/**
 * HeroCard props interface - must be identical on both platforms.
 */
export interface HeroCardProps {
  currentMonth: string;
  totalSpending: number;
  spendingChange: number | null;
  budgetProgress: number;
  budgetRemaining: number;
  hasBudget: boolean;
}

export const heroCardStyles = {
  /** Container min heights */
  heights: {
    mobile: 280,
    desktop: 380,
  },

  /** Outer container padding (mobile only - web uses grid) */
  outerPadding: {
    horizontal: 16,
    top: 16,
    bottom: 8,
  },

  /** Inner content padding */
  padding: {
    mobile: 24,
    desktop: 40,
  },

  /** Border radius */
  borderRadius: {
    outer: 24,
    inner: 23,
  },

  /** Gradient border - builds the linear-gradient string */
  gradient: {
    oklch: {
      start: "oklch(0.35 0.15 260)",
      mid: "oklch(0.25 0.1 280)",
      end: "oklch(0.2 0.08 300)",
    },
  },

  /** Inner surface color */
  surface: {
    oklch: "oklch(0.11 0.02 260)",
  },

  /** Inner glow overlay */
  glow: {
    oklch: "oklch(0.4 0.15 260)",
    opacity: 0.15,
  },

  /** Layout class strings */
  layout: {
    /** Outer wrapper for gradient border effect */
    gradientWrapper: "rounded-3xl overflow-hidden",
    /** Inner content container */
    content: "relative h-full flex flex-col justify-between",
  },

  /** Header section */
  header: {
    container: "flex flex-row justify-between items-start",
    monthLabel: "text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground",
    subtitle: "text-xs text-foreground-secondary mt-1",
  },

  /** Amount display section */
  amount: {
    container: "flex flex-1 flex-col justify-center items-start py-6",
  },

  /** Budget progress section */
  budgetProgress: {
    container: "flex flex-col gap-3",
    labelRow: "flex flex-row justify-between items-center",
    label: "text-[13px] text-muted-foreground font-medium",
    remaining: "text-[13px] text-foreground font-semibold",
  },
} as const;

/**
 * Pre-computed hex colors for mobile (React Native doesn't support oklch).
 */
export const heroCardHexColors = {
  gradientStart: oklchToHex(heroCardStyles.gradient.oklch.start),
  gradientMid: oklchToHex(heroCardStyles.gradient.oklch.mid),
  gradientEnd: oklchToHex(heroCardStyles.gradient.oklch.end),
  surface: oklchToHex(heroCardStyles.surface.oklch),
  glow: oklchToHex(heroCardStyles.glow.oklch),
} as const;

/**
 * Get the gradient CSS string for web.
 */
export function getHeroGradientCSS(): string {
  const { start, mid, end } = heroCardStyles.gradient.oklch;
  return `linear-gradient(135deg, ${start} 0%, ${mid} 50%, ${end} 100%)`;
}

/**
 * Get the glow radial gradient CSS string for web.
 */
export function getHeroGlowCSS(): string {
  return `radial-gradient(ellipse at 20% 20%, oklch(0.4 0.15 260 / 0.15) 0%, transparent 50%)`;
}
