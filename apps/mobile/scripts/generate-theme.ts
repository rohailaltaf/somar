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
    " * Auto-generated from @somar/shared theme colors.",
    " * DO NOT EDIT MANUALLY - run: pnpm --filter mobile generate:theme",
    " *",
    " * All colors are RGB equivalents of the web's oklch values",
    " * to ensure perfect visual consistency across platforms.",
    " */",
    "",
    "/* Light mode (default) */",
    ":root {",
  ];

  // Light mode base colors
  for (const [key, cssVar] of Object.entries(colorMapping)) {
    const rgb = rgbColors.light[key as keyof typeof rgbColors.light];
    if (rgb) {
      lines.push(`  --color-${cssVar}: ${rgb};`);
    }
  }

  // Light mode extended colors
  for (const [key, cssVar] of Object.entries(extendedColorMapping)) {
    const rgb =
      extendedRgbColors.light[key as keyof typeof extendedRgbColors.light];
    if (rgb) {
      lines.push(`  --color-${cssVar}: ${rgb};`);
    }
  }

  // Light mode text hierarchy (derived from base colors)
  lines.push("");
  lines.push("  /* Text hierarchy */");
  lines.push(`  --color-text-primary: ${rgbColors.light.foreground};`);
  lines.push(`  --color-text-secondary: ${rgbColors.light.mutedForeground};`);
  lines.push(`  --color-text-tertiary: ${rgbColors.light.mutedForeground};`);
  lines.push(`  --color-text-inverse: ${rgbColors.light.primaryForeground};`);
  lines.push("");
  lines.push("  /* Overlay */");
  lines.push("  --color-overlay: 0 0 0;");

  lines.push("}");
  lines.push("");
  lines.push("/* Dark mode - Premium Financial Observatory theme */");
  lines.push("@media (prefers-color-scheme: dark) {");
  lines.push("  :root {");

  // Dark mode base colors
  for (const [key, cssVar] of Object.entries(colorMapping)) {
    const rgb = rgbColors.dark[key as keyof typeof rgbColors.dark];
    if (rgb) {
      lines.push(`    --color-${cssVar}: ${rgb};`);
    }
  }

  // Dark mode extended colors
  for (const [key, cssVar] of Object.entries(extendedColorMapping)) {
    const rgb =
      extendedRgbColors.dark[key as keyof typeof extendedRgbColors.dark];
    if (rgb) {
      lines.push(`    --color-${cssVar}: ${rgb};`);
    }
  }

  // Dark mode text hierarchy
  lines.push("");
  lines.push("    /* Text hierarchy */");
  lines.push(`    --color-text-primary: ${rgbColors.dark.foreground};`);
  lines.push(`    --color-text-secondary: ${rgbColors.dark.mutedForeground};`);
  lines.push(`    --color-text-tertiary: ${rgbColors.dark.mutedForeground};`);
  lines.push(`    --color-text-inverse: ${rgbColors.dark.background};`);
  lines.push("");
  lines.push("    /* Overlay */");
  lines.push("    --color-overlay: 0 0 0;");

  lines.push("  }");
  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

// Generate and write the CSS
const css = generateCSS();
const outputPath = path.join(__dirname, "..", "global.css");

fs.writeFileSync(outputPath, css, "utf-8");

console.log(`Generated ${outputPath}`);
console.log(
  `  Light mode: ${Object.keys(colorMapping).length + Object.keys(extendedColorMapping).length} colors`
);
console.log(
  `  Dark mode: ${Object.keys(colorMapping).length + Object.keys(extendedColorMapping).length} colors`
);
