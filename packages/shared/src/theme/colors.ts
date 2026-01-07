/**
 * Single source of truth for all theme colors.
 *
 * Colors are defined in oklch format (the web standard) and pre-computed
 * to hex/RGB formats for React Native compatibility.
 *
 * Usage:
 * - Web: Use oklch values directly in CSS, or import hex for JS
 * - Mobile: Import hex values for native components, RGB for NativeWind CSS
 */

import { oklchToHex, oklchToRgbTriplet } from "../utils/color";

/**
 * Core color definitions in oklch format.
 * This is the canonical source - all other formats are derived from this.
 */
export const oklchColors = {
  light: {
    // Base
    background: "oklch(0.98 0.005 260)",
    foreground: "oklch(0.15 0.02 260)",

    // Card/Popover
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.15 0.02 260)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.15 0.02 260)",

    // Primary
    primary: "oklch(0.45 0.18 260)",
    primaryForeground: "oklch(0.98 0 0)",

    // Secondary
    secondary: "oklch(0.95 0.01 260)",
    secondaryForeground: "oklch(0.25 0.02 260)",

    // Muted
    muted: "oklch(0.95 0.01 260)",
    mutedForeground: "oklch(0.5 0.02 260)",

    // Accent
    accent: "oklch(0.92 0.02 260)",
    accentForeground: "oklch(0.25 0.02 260)",

    // Semantic
    destructive: "oklch(0.55 0.22 25)",
    success: "oklch(0.6 0.18 145)",
    warning: "oklch(0.75 0.18 85)",

    // Border/Input
    border: "oklch(0.9 0.01 260)",
    borderSubtle: "oklch(0.95 0.01 260)",
    input: "oklch(0.9 0.01 260)",
    ring: "oklch(0.45 0.18 260)",

    // Surface (light mode uses card-like surfaces)
    surface: "oklch(0.97 0.005 260)",
    surfaceElevated: "oklch(1 0 0)",
  },

  dark: {
    // Base
    background: "oklch(0.08 0.015 260)",
    foreground: "oklch(0.95 0.01 260)",

    // Card/Popover
    card: "oklch(0.11 0.02 260)",
    cardForeground: "oklch(0.95 0.01 260)",
    popover: "oklch(0.18 0.02 260)",
    popoverForeground: "oklch(0.95 0.01 260)",

    // Primary
    primary: "oklch(0.65 0.18 260)",
    primaryForeground: "oklch(0.08 0.015 260)",

    // Secondary
    secondary: "oklch(0.25 0.02 260)",
    secondaryForeground: "oklch(0.95 0.01 260)",

    // Muted
    muted: "oklch(0.25 0.02 260)",
    mutedForeground: "oklch(0.65 0.02 260)",

    // Accent
    accent: "oklch(0.25 0.02 260)",
    accentForeground: "oklch(0.95 0.01 260)",

    // Semantic
    destructive: "oklch(0.7 0.18 25)",
    success: "oklch(0.7 0.15 145)",
    warning: "oklch(0.75 0.18 75)",

    // Border/Input
    border: "oklch(0.28 0.02 260)",
    borderSubtle: "oklch(0.22 0.02 260)",
    input: "oklch(0.28 0.02 260)",
    ring: "oklch(0.65 0.18 260)",

    // Surface hierarchy (premium dark theme)
    surfaceDeep: "oklch(0.08 0.015 260)",
    surface: "oklch(0.12 0.02 260)",
    surfaceElevated: "oklch(0.16 0.02 260)",
    surfaceOverlay: "oklch(0.18 0.02 260)",

    // Extended text hierarchy
    foregroundBright: "oklch(0.98 0.01 260)",
    foregroundSecondary: "oklch(0.85 0.02 260)",
    foregroundMuted: "oklch(0.65 0.02 260)",
    foregroundDim: "oklch(0.45 0.02 260)",

    // Premium accent (gold)
    gold: "oklch(0.78 0.12 75)",
    goldMuted: "oklch(0.55 0.08 75)",
  },
} as const;

/**
 * Semantic color tokens (same in both modes, just different values)
 */
export const semanticColorKeys = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "success",
  "warning",
  "border",
  "borderSubtle",
  "surface",
  "surfaceElevated",
] as const;

type ColorMode = "light" | "dark";
type LightColorKey = keyof typeof oklchColors.light;
type DarkColorKey = keyof typeof oklchColors.dark;

/**
 * Pre-computed hex colors for native components.
 * Use these when you need a color string for React Native components
 * that don't support className (ActivityIndicator, Lucide icons, etc.)
 */
export const hexColors = {
  light: Object.fromEntries(
    Object.entries(oklchColors.light).map(([key, value]) => [
      key,
      oklchToHex(value),
    ])
  ) as Record<LightColorKey, string>,

  dark: Object.fromEntries(
    Object.entries(oklchColors.dark).map(([key, value]) => [
      key,
      oklchToHex(value),
    ])
  ) as Record<DarkColorKey, string>,
} as const;

/**
 * Pre-computed RGB triplets for NativeWind CSS variables.
 * Format: "R G B" (space-separated, no commas)
 */
export const rgbColors = {
  light: Object.fromEntries(
    Object.entries(oklchColors.light).map(([key, value]) => [
      key,
      oklchToRgbTriplet(value),
    ])
  ) as Record<LightColorKey, string>,

  dark: Object.fromEntries(
    Object.entries(oklchColors.dark).map(([key, value]) => [
      key,
      oklchToRgbTriplet(value),
    ])
  ) as Record<DarkColorKey, string>,
} as const;

/**
 * Get theme colors for a specific mode.
 * Convenience function for components that need mode-aware colors.
 */
export function getThemeColors(mode: ColorMode) {
  return {
    oklch: mode === "light" ? oklchColors.light : oklchColors.dark,
    hex: mode === "light" ? hexColors.light : hexColors.dark,
    rgb: mode === "light" ? rgbColors.light : rgbColors.dark,
  };
}

/**
 * Extended semantic colors for muted variants (used in mobile UI)
 */
export const extendedColors = {
  light: {
    primaryMuted: "oklch(0.92 0.08 260)",
    destructiveMuted: "oklch(0.95 0.08 25)",
    successMuted: "oklch(0.95 0.08 145)",
    warningMuted: "oklch(0.95 0.08 85)",
  },
  dark: {
    primaryMuted: "oklch(0.25 0.08 260)",
    destructiveMuted: "oklch(0.25 0.08 25)",
    successMuted: "oklch(0.25 0.08 145)",
    warningMuted: "oklch(0.25 0.08 75)",
  },
} as const;

export const extendedHexColors = {
  light: Object.fromEntries(
    Object.entries(extendedColors.light).map(([key, value]) => [
      key,
      oklchToHex(value),
    ])
  ) as Record<keyof typeof extendedColors.light, string>,

  dark: Object.fromEntries(
    Object.entries(extendedColors.dark).map(([key, value]) => [
      key,
      oklchToHex(value),
    ])
  ) as Record<keyof typeof extendedColors.dark, string>,
} as const;

export const extendedRgbColors = {
  light: Object.fromEntries(
    Object.entries(extendedColors.light).map(([key, value]) => [
      key,
      oklchToRgbTriplet(value),
    ])
  ) as Record<keyof typeof extendedColors.light, string>,

  dark: Object.fromEntries(
    Object.entries(extendedColors.dark).map(([key, value]) => [
      key,
      oklchToRgbTriplet(value),
    ])
  ) as Record<keyof typeof extendedColors.dark, string>,
} as const;
