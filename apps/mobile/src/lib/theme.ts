/**
 * Theme colors for native components that need string values.
 *
 * NativeWind handles CSS-in-JS styling via className, but some React Native
 * components (Lucide icons, ActivityIndicator, RefreshControl, etc.) require
 * explicit color strings. This module provides theme-aware colors for those cases.
 *
 * Colors are imported from @somar/shared - the single source of truth.
 */

import { hexColors, extendedHexColors } from "@somar/shared/theme";

export const themeColors = {
  light: {
    // Base
    background: hexColors.light.background,
    foreground: hexColors.light.foreground,
    // Primary
    primary: hexColors.light.primary,
    primaryForeground: hexColors.light.primaryForeground,
    primaryMuted: extendedHexColors.light.primaryMuted,
    // Muted
    mutedForeground: hexColors.light.mutedForeground,
    muted: hexColors.light.muted,
    // Semantic
    success: hexColors.light.success,
    successMuted: extendedHexColors.light.successMuted,
    destructive: hexColors.light.destructive,
    destructiveMuted: extendedHexColors.light.destructiveMuted,
    warning: hexColors.light.warning,
    warningMuted: extendedHexColors.light.warningMuted,
    // Surface
    card: hexColors.light.card,
    border: hexColors.light.border,
    borderSubtle: hexColors.light.borderSubtle,
    surface: hexColors.light.surface,
    surfaceElevated: hexColors.light.surfaceElevated,
    // Premium accent
    gold: hexColors.light.gold,
    goldMuted: hexColors.light.goldMuted,
  },
  dark: {
    // Base
    background: hexColors.dark.background,
    foreground: hexColors.dark.foreground,
    // Primary
    primary: hexColors.dark.primary,
    primaryForeground: hexColors.dark.primaryForeground,
    primaryMuted: extendedHexColors.dark.primaryMuted,
    // Muted
    mutedForeground: hexColors.dark.mutedForeground,
    muted: hexColors.dark.muted,
    // Semantic
    success: hexColors.dark.success,
    successMuted: extendedHexColors.dark.successMuted,
    destructive: hexColors.dark.destructive,
    destructiveMuted: extendedHexColors.dark.destructiveMuted,
    warning: hexColors.dark.warning,
    warningMuted: extendedHexColors.dark.warningMuted,
    // Surface hierarchy
    card: hexColors.dark.card,
    border: hexColors.dark.border,
    borderSubtle: hexColors.dark.borderSubtle,
    surface: hexColors.dark.surface,
    surfaceElevated: hexColors.dark.surfaceElevated,
    // Text hierarchy
    foregroundDim: hexColors.dark.foregroundDim,
    // Premium (dark only)
    gold: hexColors.dark.gold,
    goldMuted: hexColors.dark.goldMuted,
  },
} as const;

export type ThemeColors = typeof themeColors.light | typeof themeColors.dark;
