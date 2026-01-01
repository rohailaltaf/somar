/**
 * Theme colors for native components that need string values.
 *
 * NativeWind handles CSS-in-JS styling via className, but some React Native
 * components (Ionicons, ActivityIndicator, RefreshControl, etc.) require
 * explicit color strings. This module provides theme-aware colors for those cases.
 *
 * Values are derived from global.css CSS variables.
 */
export const themeColors = {
  light: {
    primaryForeground: "#ffffff",
    primary: "#6366f1",
    mutedForeground: "#64748b",
  },
  dark: {
    primaryForeground: "#0f172a",
    primary: "#818cf8",
    mutedForeground: "#94a3b8",
  },
} as const;

export type ThemeColors = typeof themeColors.light;
