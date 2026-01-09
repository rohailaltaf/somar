/**
 * Generate mobile's global.css from the shared theme colors.
 *
 * This script reads the oklch color definitions from @somar/shared
 * and generates a CSS file with RGB triplets for NativeWind.
 *
 * Run: pnpm --filter mobile generate:theme
 */

import * as fs from "fs";
import * as path from "path";
import { rgbColors, extendedRgbColors } from "@somar/shared/theme";

// Map our color keys to CSS variable names
const colorMapping = {
  // Base
  background: "background",
  foreground: "foreground",

  // Card
  card: "card",
  cardForeground: "card-foreground",

  // Surface
  surface: "surface",
  surfaceElevated: "surface-elevated",

  // Muted/Secondary
  muted: "muted",
  mutedForeground: "muted-foreground",
  secondary: "secondary",
  secondaryForeground: "secondary-foreground",

  // Primary
  primary: "primary",
  primaryForeground: "primary-foreground",

  // Semantic
  border: "border",
  borderSubtle: "border-subtle",
  destructive: "destructive",
  success: "success",
  warning: "warning",
  accent: "accent",
  // Premium accent (gold)
  gold: "gold",
  goldMuted: "gold-muted",
} as const;

// Navigation colors
const navColorMapping = {
  navDock: "nav-dock",
  navIndicator: "nav-indicator",
  navInactiveIcon: "nav-inactive-icon",
  navInactiveLabel: "nav-inactive-label",
} as const;

const extendedColorMapping = {
  primaryMuted: "primary-muted",
  destructiveMuted: "destructive-muted",
  successMuted: "success-muted",
  warningMuted: "warning-muted",
} as const;

function generateCSS(): string {
  const lines: string[] = [
    "@tailwind base;",
    "@tailwind components;",
    "@tailwind utilities;",
    "",
    "/*",
    " * Auto-generated from @somar/shared theme colors (dark mode only).",
    " * DO NOT EDIT MANUALLY - run: pnpm --filter mobile generate:theme",
    " *",
    " * All colors are RGB equivalents of the web's oklch values",
    " * to ensure perfect visual consistency across platforms.",
    " */",
    "",
    ":root {",
  ];

  // Base colors
  for (const [key, cssVar] of Object.entries(colorMapping)) {
    const rgb = rgbColors[key as keyof typeof rgbColors];
    if (rgb) {
      lines.push(`  --color-${cssVar}: ${rgb};`);
    }
  }

  // Extended colors
  for (const [key, cssVar] of Object.entries(extendedColorMapping)) {
    const rgb = extendedRgbColors[key as keyof typeof extendedRgbColors];
    if (rgb) {
      lines.push(`  --color-${cssVar}: ${rgb};`);
    }
  }

  // Navigation colors
  for (const [key, cssVar] of Object.entries(navColorMapping)) {
    const rgb = rgbColors[key as keyof typeof rgbColors];
    if (rgb) {
      lines.push(`  --color-${cssVar}: ${rgb};`);
    }
  }

  // Text hierarchy (derived from base colors)
  lines.push("");
  lines.push("  /* Text hierarchy */");
  lines.push(`  --color-text-primary: ${rgbColors.foreground};`);
  lines.push(`  --color-text-secondary: ${rgbColors.mutedForeground};`);
  lines.push(`  --color-text-tertiary: ${rgbColors.mutedForeground};`);
  lines.push(`  --color-text-inverse: ${rgbColors.background};`);
  lines.push("");
  lines.push("  /* Overlay */");
  lines.push("  --color-overlay: 0 0 0;");

  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

// Generate and write the CSS
const css = generateCSS();
const outputPath = path.join(__dirname, "..", "global.css");

fs.writeFileSync(outputPath, css, "utf-8");

console.log(`Generated ${outputPath}`);
const totalColors =
  Object.keys(colorMapping).length +
  Object.keys(extendedColorMapping).length +
  Object.keys(navColorMapping).length;
console.log(`  Total colors: ${totalColors}`);
