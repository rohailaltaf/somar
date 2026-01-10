/**
 * AnimatedCurrency shared styles.
 * Used by both web and mobile implementations.
 *
 * Note: Font sizes differ between platforms due to responsive requirements on web.
 * This file shares common layout and color patterns.
 */

export const animatedCurrencyStyles = {
  /** Container - horizontal layout with baseline alignment */
  container: "flex flex-row items-baseline",

  /** Dollar text color */
  dollarsColor: "text-foreground-bright",

  /** Cents text color */
  centsColor: "text-foreground-dim",

  /** Font family reference - serif for visual hierarchy */
  fontFamily: {
    web: "font-[family-name:var(--font-serif)]",
    mobile: "InstrumentSerif_400Regular",
  },

  /** Base font styling - use leading-[1.1] to prevent clipping serif descenders */
  dollars: "tracking-tight leading-[1.1]",
  cents: "ml-1 leading-[1.1]",

  /** Size variants (mobile uses fixed, web can use responsive) */
  sizes: {
    /** Large hero display */
    hero: {
      dollars: "text-[64px]",
      cents: "text-[32px]",
    },
    /** Medium display */
    medium: {
      dollars: "text-[48px]",
      cents: "text-[24px]",
    },
  },
} as const;
