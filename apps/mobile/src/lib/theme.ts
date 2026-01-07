/**
 * Theme colors for native components that need string values.
 *
 * NativeWind handles CSS-in-JS styling via className, but some React Native
 * components (Lucide icons, ActivityIndicator, RefreshControl, etc.) require
 * explicit color strings. This module provides theme-aware colors for those cases.
 *
 * Values are synchronized with web's oklch color system using oklchToHex.
 */
import { oklchToHex } from "./color";

export const themeColors = {
  light: {
    // Base
    background: oklchToHex("oklch(0.98 0.005 260)"),
    foreground: oklchToHex("oklch(0.15 0.02 260)"),
    // Primary
    primary: oklchToHex("oklch(0.45 0.18 260)"),
    primaryForeground: "#ffffff",
    primaryMuted: "#e0defc",
    // Muted
    mutedForeground: oklchToHex("oklch(0.5 0.02 260)"),
    muted: oklchToHex("oklch(0.95 0.01 260)"),
    // Semantic
    success: "#22c55e",
    successMuted: "#dcfce7",
    destructive: "#dc3545",
    destructiveMuted: "#fee2e4",
    warning: "#f59e0b",
    warningMuted: "#fef3c7",
    // Surface
    card: "#ffffff",
    border: "#e2e4ee",
    borderSubtle: "#edeef4",
    // Premium
    premiumGold: oklchToHex("oklch(0.78 0.12 75)"),
    premiumSurface: "#f8fafc",
    premiumGlow: oklchToHex("oklch(0.45 0.18 260)"),
  },
  dark: {
    // Base - matched to web
    background: oklchToHex("oklch(0.08 0.015 260)"),
    foreground: oklchToHex("oklch(0.95 0.01 260)"),
    // Primary
    primary: oklchToHex("oklch(0.65 0.18 260)"),
    primaryForeground: oklchToHex("oklch(0.08 0.015 260)"),
    primaryMuted: "#2e2d5c",
    // Muted
    mutedForeground: oklchToHex("oklch(0.65 0.02 260)"),
    muted: oklchToHex("oklch(0.25 0.02 260)"),
    // Semantic - matched to web oklch values
    success: "#4ade80",
    successMuted: "#1c4834",
    destructive: oklchToHex("oklch(0.7 0.18 25)"),
    destructiveMuted: "#44232a",
    warning: oklchToHex("oklch(0.75 0.18 75)"),
    warningMuted: "#443a1c",
    // Surface - matched to web
    card: oklchToHex("oklch(0.11 0.02 260)"),
    border: "#2e3242",
    borderSubtle: "#1e2130",
    // Premium
    premiumGold: oklchToHex("oklch(0.78 0.12 75)"),
    premiumSurface: oklchToHex("oklch(0.12 0.02 260)"),
    premiumGlow: oklchToHex("oklch(0.45 0.18 260)"),
    // Atmospheric orb colors for background effects
    orbPrimary: oklchToHex("oklch(0.35 0.15 260)"),
    orbGold: oklchToHex("oklch(0.78 0.12 75)"),
  },
} as const;

export type ThemeColors = typeof themeColors.light | typeof themeColors.dark;
