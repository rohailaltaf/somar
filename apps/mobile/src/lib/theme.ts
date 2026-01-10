/**
 * Theme colors for native components that need string values.
 *
 * NativeWind handles CSS-in-JS styling via className, but some React Native
 * components (Lucide icons, ActivityIndicator, RefreshControl, etc.) require
 * explicit color strings. This module provides colors for those cases.
 *
 * Colors are imported from @somar/shared - the single source of truth.
 */

import { hexColors, extendedHexColors } from "@somar/shared/theme";

export const colors = {
  // Base
  background: hexColors.background,
  foreground: hexColors.foreground,
  // Primary
  primary: hexColors.primary,
  primaryForeground: hexColors.primaryForeground,
  primaryMuted: extendedHexColors.primaryMuted,
  // Muted
  mutedForeground: hexColors.mutedForeground,
  muted: hexColors.muted,
  // Semantic
  success: hexColors.success,
  successMuted: extendedHexColors.successMuted,
  destructive: hexColors.destructive,
  destructiveMuted: extendedHexColors.destructiveMuted,
  warning: hexColors.warning,
  warningMuted: extendedHexColors.warningMuted,
  // Surface hierarchy
  card: hexColors.card,
  border: hexColors.border,
  borderSubtle: hexColors.borderSubtle,
  surface: hexColors.surface,
  surfaceElevated: hexColors.surfaceElevated,
  // Text hierarchy
  foregroundDim: hexColors.foregroundDim,
  // Premium
  gold: hexColors.gold,
  goldMuted: hexColors.goldMuted,
} as const;

export type Colors = typeof colors;
// Backwards compatibility alias
export type ThemeColors = Colors;
