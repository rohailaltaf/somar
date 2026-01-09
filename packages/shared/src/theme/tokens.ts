/**
 * Unified Design Tokens
 *
 * Single source of truth for all design values used across web and mobile.
 * Import individual tokens or the combined `tokens` object.
 *
 * @example
 * import { shadows, timing, easing } from "@somar/shared/theme";
 * import { tokens } from "@somar/shared/theme";
 */

// Re-export spacing and radius from their dedicated file
export { spacing, radius } from "./spacing";
export type { SpacingKey, SpacingValue, RadiusKey, RadiusValue } from "./spacing";

/**
 * Shadow tokens - consistent elevation across platforms.
 *
 * Usage (Web - Tailwind):
 *   className="shadow-soft" or style={{ boxShadow: shadows.css.soft }}
 *
 * Usage (Mobile - React Native):
 *   style={shadows.native.soft}
 *
 * Semantic names:
 *   - soft: Subtle depth for small UI elements (inputs, badges)
 *   - card: Standard elevation for cards and containers
 *   - elevated: Floating elements (FABs, floating tab bars)
 *   - strong: Heavy elevation (modals, popovers, dropdowns)
 */
export const shadows = {
  /** CSS box-shadow values for web */
  css: {
    none: "none",
    soft: "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
    card: "0 4px 12px -4px rgba(0, 0, 0, 0.1)",
    elevated: "0 8px 24px -8px rgba(0, 0, 0, 0.15)",
    strong: "0 12px 32px -8px rgba(0, 0, 0, 0.25)",
    /** Floating dock shadow - multi-layered for depth */
    dock: `
      0 2px 4px -1px rgba(0, 0, 0, 0.3),
      0 8px 20px -4px rgba(0, 0, 0, 0.4),
      0 20px 40px -8px rgba(0, 0, 0, 0.3)
    `,
  },
  /** React Native shadow props (iOS + Android elevation) */
  native: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    soft: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    elevated: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    strong: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
      elevation: 16,
    },
    /** Floating dock shadow - stronger for floating UI */
    dock: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 20,
    },
  },
} as const;

/**
 * Animation timing tokens - consistent durations in milliseconds.
 *
 * Usage:
 *   // Framer Motion (web)
 *   animate={{ opacity: 1 }} transition={{ duration: timing.base / 1000 }}
 *
 *   // React Native Reanimated
 *   withTiming(1, { duration: timing.base })
 *
 * Semantic names:
 *   - instant: Immediate feedback (focus rings, active states)
 *   - fast: Micro-interactions (button press, toggle)
 *   - base: Standard transitions (hover, expand/collapse)
 *   - slow: Complex animations (page transitions, charts)
 *   - slower: Long emphasis animations (onboarding, celebrations)
 */
export const timing = {
  /** Immediate - 0ms */
  instant: 0,
  /** Micro-interactions - 100ms */
  fast: 100,
  /** Standard transitions - 200ms */
  base: 200,
  /** Deliberate transitions - 300ms */
  moderate: 300,
  /** Complex animations - 500ms */
  slow: 500,
  /** Emphasis animations - 700ms */
  slower: 700,
  /** Long animations (charts, celebrations) - 1000ms */
  long: 1000,
} as const;

/**
 * Easing tokens - consistent animation curves.
 *
 * Usage (Web - Framer Motion):
 *   transition={{ ease: easing.smooth }}
 *
 * Usage (Web - CSS):
 *   transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
 *
 * Usage (Mobile - Reanimated):
 *   import { Easing } from "react-native-reanimated";
 *   withTiming(value, { easing: Easing.bezier(...easing.smooth) })
 */
export const easing = {
  /** Linear - no acceleration */
  linear: [0, 0, 1, 1] as const,
  /** Standard ease-out - fast start, slow end (most common) */
  out: [0, 0, 0.2, 1] as const,
  /** Standard ease-in - slow start, fast end */
  in: [0.4, 0, 1, 1] as const,
  /** Standard ease-in-out - slow start and end */
  inOut: [0.4, 0, 0.2, 1] as const,
  /** Smooth - expressive, slightly bouncy feel */
  smooth: [0.16, 1, 0.3, 1] as const,
  /** Bounce - overshoots then settles */
  bounce: [0.34, 1.56, 0.64, 1] as const,
} as const;

/**
 * Spring animation presets for React Native Reanimated.
 *
 * Usage:
 *   import { withSpring } from "react-native-reanimated";
 *   withSpring(value, spring.snappy)
 */
export const spring = {
  /** Default balanced spring */
  default: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  /** Quick, responsive spring for UI feedback */
  snappy: {
    damping: 30,
    stiffness: 400,
    mass: 0.8,
  },
  /** Gentle, smooth spring for larger movements */
  gentle: {
    damping: 25,
    stiffness: 200,
    mass: 1.2,
  },
  /** Bouncy spring for playful animations */
  bouncy: {
    damping: 10,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

/**
 * Z-index scale - consistent stacking order.
 *
 * Usage:
 *   style={{ zIndex: zIndex.modal }}
 *   className="z-dropdown" (if added to Tailwind config)
 */
export const zIndex = {
  /** Below everything (backgrounds) */
  behind: -1,
  /** Default stacking */
  base: 0,
  /** Slightly raised (cards on hover) */
  raised: 10,
  /** Dropdowns, popovers */
  dropdown: 100,
  /** Sticky headers, floating buttons */
  sticky: 200,
  /** Fixed elements (tab bars) */
  fixed: 300,
  /** Modals, dialogs */
  modal: 400,
  /** Tooltips */
  tooltip: 500,
  /** Toast notifications */
  toast: 600,
  /** Above everything (loading overlays) */
  max: 9999,
} as const;

// Type exports
export type ShadowLevel = keyof typeof shadows.css;
export type TimingKey = keyof typeof timing;
export type EasingKey = keyof typeof easing;
export type SpringKey = keyof typeof spring;
export type ZIndexKey = keyof typeof zIndex;

/**
 * Combined tokens object for convenience.
 *
 * @example
 * import { tokens } from "@somar/shared/theme";
 * tokens.timing.base // 200
 * tokens.shadows.css.card // "0 4px 12px..."
 */
export const tokens = {
  shadows,
  timing,
  easing,
  spring,
  zIndex,
} as const;
