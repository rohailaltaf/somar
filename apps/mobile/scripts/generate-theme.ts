/**
 * Generate mobile's global.css from the shared theme colors.
 *
 * This script reads color definitions from @somar/shared/theme
 * and generates a CSS file with RGB triplets for NativeWind.
 *
 * Run: pnpm --filter mobile generate:theme
 * Or from root: pnpm generate:theme
 */

import * as fs from "fs";
import * as path from "path";
import {
  rgbColors,
  extendedRgbColors,
  staticRgbColors,
} from "@somar/shared/theme";

/**
 * Maps camelCase keys to kebab-case CSS variable names.
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generateCSS(): string {
  const lines: string[] = [
    "@tailwind base;",
    "@tailwind components;",
    "@tailwind utilities;",
    "",
    "/*",
    " * Auto-generated from @somar/shared/theme (dark mode only).",
    " * DO NOT EDIT MANUALLY - run: pnpm generate:theme",
    " *",
    " * All colors are RGB equivalents of the web's oklch values",
    " * to ensure perfect visual consistency across platforms.",
    " */",
    "",
    ":root {",
  ];

  // Core colors
  for (const [key, value] of Object.entries(rgbColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --color-${cssVar}: ${value};`);
  }

  // Extended colors (muted variants)
  for (const [key, value] of Object.entries(extendedRgbColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --color-${cssVar}: ${value};`);
  }

  // Static colors (charts, sidebar, danger) - useful for consistency
  for (const [key, value] of Object.entries(staticRgbColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --color-${cssVar}: ${value};`);
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

const totalColors =
  Object.keys(rgbColors).length +
  Object.keys(extendedRgbColors).length +
  Object.keys(staticRgbColors).length;

console.log(`Generated ${outputPath}`);
console.log(`  Total colors: ${totalColors}`);
