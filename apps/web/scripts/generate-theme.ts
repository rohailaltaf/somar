/**
 * Generate web's globals.css from the shared theme colors.
 *
 * This script reads color definitions from @somar/shared/theme
 * and generates CSS variables for the dark-only theme.
 *
 * Run: pnpm --filter web generate:theme
 * Or from root: pnpm generate:theme
 */

import * as fs from "fs";
import * as path from "path";
import {
  oklchColors,
  extendedColors,
  staticColors,
} from "@somar/shared/theme";

/**
 * Maps camelCase keys to kebab-case CSS variable names.
 * Only keys listed here will be output to CSS.
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generateCSS(): string {
  const lines: string[] = [
    `@import "tailwindcss";`,
    `@import "tw-animate-css";`,
    ``,
    `/* Include shared package for Tailwind v4 class scanning */`,
    `@source "../../../../packages/shared/src/**/*.ts";`,
    ``,
    `@custom-variant dark (&:is(.dark *));`,
    ``,
    `/*`,
    ` * Auto-generated from @somar/shared/theme (dark mode only).`,
    ` * DO NOT EDIT MANUALLY - run: pnpm generate:theme`,
    ` */`,
    ``,
  ];

  // Build @theme inline block with all color mappings
  lines.push(`@theme inline {`);
  lines.push(`  --color-background: var(--background);`);
  lines.push(`  --color-foreground: var(--foreground);`);
  lines.push(`  --font-sans: var(--font-sans), "DM Sans", system-ui, sans-serif;`);
  lines.push(`  --font-serif: var(--font-serif), "Instrument Serif", Georgia, serif;`);
  lines.push(`  --font-mono: ui-monospace, monospace;`);

  // Core colors
  for (const key of Object.keys(oklchColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --color-${cssVar}: var(--${cssVar});`);
  }

  // Extended colors (muted variants)
  for (const key of Object.keys(extendedColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --color-${cssVar}: var(--${cssVar});`);
  }

  // Static colors (charts, sidebar, danger)
  for (const key of Object.keys(staticColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --color-${cssVar}: var(--${cssVar});`);
  }

  // Radius tokens
  lines.push(`  --radius-sm: calc(var(--radius) - 4px);`);
  lines.push(`  --radius-md: calc(var(--radius) - 2px);`);
  lines.push(`  --radius-lg: var(--radius);`);
  lines.push(`  --radius-xl: calc(var(--radius) + 4px);`);

  lines.push(`}`);
  lines.push(``);

  // :root with all oklch values
  lines.push(`:root {`);
  lines.push(`  --radius: 0.625rem;`);

  // Core colors
  for (const [key, value] of Object.entries(oklchColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --${cssVar}: ${value};`);
  }

  // Extended colors
  for (const [key, value] of Object.entries(extendedColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --${cssVar}: ${value};`);
  }

  // Static colors
  for (const [key, value] of Object.entries(staticColors)) {
    const cssVar = toKebabCase(key);
    lines.push(`  --${cssVar}: ${value};`);
  }

  lines.push(`}`);
  lines.push(``);

  // Base layer
  lines.push(`@layer base {`);
  lines.push(`  * {`);
  lines.push(`    @apply border-border outline-ring/50;`);
  lines.push(`  }`);
  lines.push(`  html {`);
  lines.push(`    font-size: 14px; /* Match NativeWind's rem base for cross-platform consistency */`);
  lines.push(`  }`);
  lines.push(`  html, body {`);
  lines.push(`    @apply bg-background text-foreground overflow-x-hidden;`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);

  // Animations
  lines.push(`/* Animations */`);
  lines.push(`@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-ring {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes breathe {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-count-up {
  animation: countUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-pulse-ring {
  animation: pulse-ring 3s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    oklch(1 0 0 / 0.05),
    transparent
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-breathe {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.03;
  }
  50% {
    opacity: 0.045;
  }
}

.animate-pulse-glow {
  animation: pulse-glow 16s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Stagger delays */
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }
.delay-600 { animation-delay: 600ms; }
.delay-700 { animation-delay: 700ms; }
.delay-800 { animation-delay: 800ms; }

/* Custom scrollbar - hidden by default, visible on hover */
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

*:hover {
  scrollbar-color: oklch(0.7 0.02 260) transparent;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
  transition: background 0.2s ease;
}

*:hover::-webkit-scrollbar-thumb {
  background: oklch(0.7 0.02 260);
}

*:hover::-webkit-scrollbar-thumb:hover {
  background: oklch(0.6 0.02 260);
}
`);

  return lines.join("\n");
}

// Generate and write the CSS
const css = generateCSS();
const outputPath = path.join(__dirname, "..", "src", "app", "globals.css");

fs.writeFileSync(outputPath, css, "utf-8");

const totalColors =
  Object.keys(oklchColors).length +
  Object.keys(extendedColors).length +
  Object.keys(staticColors).length;

console.log(`Generated ${outputPath}`);
console.log(`  Total colors: ${totalColors}`);
