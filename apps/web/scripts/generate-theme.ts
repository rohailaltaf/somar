/**
 * Generate web's globals.css from the shared theme colors.
 *
 * This script reads the oklch color definitions from @somar/shared
 * and generates CSS variables for both light and dark modes.
 *
 * Run: pnpm --filter web generate:theme
 */

import * as fs from "fs";
import * as path from "path";
import { oklchColors, extendedColors } from "@somar/shared/theme";

// Color mapping: shared theme key -> CSS variable name
const colorMapping: Record<string, string> = {
  // Base
  background: "background",
  foreground: "foreground",

  // Card/Popover
  card: "card",
  cardForeground: "card-foreground",
  popover: "popover",
  popoverForeground: "popover-foreground",

  // Primary
  primary: "primary",
  primaryForeground: "primary-foreground",

  // Secondary
  secondary: "secondary",
  secondaryForeground: "secondary-foreground",

  // Muted
  muted: "muted",
  mutedForeground: "muted-foreground",

  // Accent
  accent: "accent",
  accentForeground: "accent-foreground",

  // Semantic
  destructive: "destructive",
  success: "success",
  warning: "warning",

  // Border/Input
  border: "border",
  borderSubtle: "border-subtle",
  input: "input",
  ring: "ring",

  // Surface
  surface: "surface",
  surfaceElevated: "surface-elevated",

  // Premium accent (gold)
  gold: "gold",
  goldMuted: "gold-muted",
};

// Dark-only colors
const darkOnlyColorMapping: Record<string, string> = {
  // Surface hierarchy
  surfaceDeep: "surface-deep",
  surfaceOverlay: "surface-overlay",

  // Extended text
  foregroundBright: "foreground-bright",
  foregroundSecondary: "foreground-secondary",
  foregroundMuted: "foreground-muted",
  foregroundDim: "foreground-dim",

  // Navigation (mobile dock - also used on web mobile view)
  navDock: "nav-dock",
  navIndicator: "nav-indicator",
  navInactiveIcon: "nav-inactive-icon",
  navInactiveLabel: "nav-inactive-label",
};

// Extended colors (muted variants)
const extendedColorMapping: Record<string, string> = {
  primaryMuted: "primary-muted",
  destructiveMuted: "destructive-muted",
  successMuted: "success-muted",
  warningMuted: "warning-muted",
};

// Static colors that aren't in shared theme (charts, sidebar)
const staticLightColors: Record<string, string> = {
  "chart-1": "oklch(0.55 0.2 260)",
  "chart-2": "oklch(0.65 0.18 160)",
  "chart-3": "oklch(0.6 0.2 30)",
  "chart-4": "oklch(0.7 0.15 80)",
  "chart-5": "oklch(0.55 0.18 330)",
  "sidebar": "oklch(0.98 0.005 260)",
  "sidebar-foreground": "oklch(0.15 0.02 260)",
  "sidebar-primary": "oklch(0.45 0.18 260)",
  "sidebar-primary-foreground": "oklch(0.98 0 0)",
  "sidebar-accent": "oklch(0.92 0.02 260)",
  "sidebar-accent-foreground": "oklch(0.25 0.02 260)",
  "sidebar-border": "oklch(0.9 0.01 260)",
  "sidebar-ring": "oklch(0.45 0.18 260)",
  "danger": "oklch(0.55 0.22 25)",
};

const staticDarkColors: Record<string, string> = {
  "chart-1": "oklch(0.65 0.2 260)",
  "chart-2": "oklch(0.7 0.18 160)",
  "chart-3": "oklch(0.7 0.2 30)",
  "chart-4": "oklch(0.75 0.15 80)",
  "chart-5": "oklch(0.65 0.18 330)",
  "sidebar": "oklch(0.15 0.02 260)",
  "sidebar-foreground": "oklch(0.95 0.01 260)",
  "sidebar-primary": "oklch(0.65 0.18 260)",
  "sidebar-primary-foreground": "oklch(0.1 0.02 260)",
  "sidebar-accent": "oklch(0.25 0.02 260)",
  "sidebar-accent-foreground": "oklch(0.95 0.01 260)",
  "sidebar-border": "oklch(0.28 0.02 260)",
  "sidebar-ring": "oklch(0.65 0.18 260)",
  "danger": "oklch(0.6 0.2 25)",
  "danger-muted": "oklch(0.7 0.15 25)",
  "border-strong": "oklch(0.35 0.02 260)",
};

function generateCSS(): string {
  const lines: string[] = [
    `@import "tailwindcss";`,
    `@import "tw-animate-css";`,
    ``,
    `@custom-variant dark (&:is(.dark *));`,
    ``,
    `/*`,
    ` * Auto-generated from @somar/shared theme colors.`,
    ` * DO NOT EDIT MANUALLY - run: pnpm --filter web generate:theme`,
    ` */`,
    ``,
    `@theme inline {`,
    `  --color-background: var(--background);`,
    `  --color-foreground: var(--foreground);`,
    `  --font-sans: var(--font-sans), "DM Sans", system-ui, sans-serif;`,
    `  --font-serif: var(--font-serif), "Instrument Serif", Georgia, serif;`,
    `  --font-mono: ui-monospace, monospace;`,
    `  --color-sidebar-ring: var(--sidebar-ring);`,
    `  --color-sidebar-border: var(--sidebar-border);`,
    `  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);`,
    `  --color-sidebar-accent: var(--sidebar-accent);`,
    `  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);`,
    `  --color-sidebar-primary: var(--sidebar-primary);`,
    `  --color-sidebar-foreground: var(--sidebar-foreground);`,
    `  --color-sidebar: var(--sidebar);`,
    `  --color-chart-5: var(--chart-5);`,
    `  --color-chart-4: var(--chart-4);`,
    `  --color-chart-3: var(--chart-3);`,
    `  --color-chart-2: var(--chart-2);`,
    `  --color-chart-1: var(--chart-1);`,
    `  --color-ring: var(--ring);`,
    `  --color-input: var(--input);`,
    `  --color-border: var(--border);`,
    `  --color-destructive: var(--destructive);`,
    `  --color-accent-foreground: var(--accent-foreground);`,
    `  --color-accent: var(--accent);`,
    `  --color-muted-foreground: var(--muted-foreground);`,
    `  --color-muted: var(--muted);`,
    `  --color-secondary-foreground: var(--secondary-foreground);`,
    `  --color-secondary: var(--secondary);`,
    `  --color-primary-foreground: var(--primary-foreground);`,
    `  --color-primary: var(--primary);`,
    `  --color-popover-foreground: var(--popover-foreground);`,
    `  --color-popover: var(--popover);`,
    `  --color-card-foreground: var(--card-foreground);`,
    `  --color-card: var(--card);`,
    `  --radius-sm: calc(var(--radius) - 4px);`,
    `  --radius-md: calc(var(--radius) - 2px);`,
    `  --radius-lg: var(--radius);`,
    `  --radius-xl: calc(var(--radius) + 4px);`,
    ``,
    `  /* Surface hierarchy (dark premium theme) */`,
    `  --color-surface-deep: var(--surface-deep);`,
    `  --color-surface: var(--surface);`,
    `  --color-surface-elevated: var(--surface-elevated);`,
    `  --color-surface-overlay: var(--surface-overlay);`,
    ``,
    `  /* Extended text hierarchy */`,
    `  --color-foreground-bright: var(--foreground-bright);`,
    `  --color-foreground-secondary: var(--foreground-secondary);`,
    `  --color-foreground-muted: var(--foreground-muted);`,
    `  --color-foreground-dim: var(--foreground-dim);`,
    ``,
    `  /* Extended border hierarchy */`,
    `  --color-border-subtle: var(--border-subtle);`,
    `  --color-border-strong: var(--border-strong);`,
    ``,
    `  /* Status colors */`,
    `  --color-success: var(--success);`,
    `  --color-success-muted: var(--success-muted);`,
    `  --color-warning: var(--warning);`,
    `  --color-danger: var(--danger);`,
    `  --color-danger-muted: var(--danger-muted);`,
    ``,
    `  /* Premium accent (gold) */`,
    `  --color-gold: var(--gold);`,
    `  --color-gold-muted: var(--gold-muted);`,
    ``,
    `  /* Navigation */`,
    `  --color-nav-dock: var(--nav-dock);`,
    `  --color-nav-indicator: var(--nav-indicator);`,
    `  --color-nav-inactive-icon: var(--nav-inactive-icon);`,
    `  --color-nav-inactive-label: var(--nav-inactive-label);`,
    ``,
    `}`,
    ``,
  ];

  // Light mode (:root)
  lines.push(`:root {`);
  lines.push(`  --radius: 0.625rem;`);

  // From shared theme
  for (const [key, cssVar] of Object.entries(colorMapping)) {
    const oklch = oklchColors.light[key as keyof typeof oklchColors.light];
    if (oklch) {
      lines.push(`  --${cssVar}: ${oklch};`);
    }
  }

  // Extended colors
  for (const [key, cssVar] of Object.entries(extendedColorMapping)) {
    const oklch = extendedColors.light[key as keyof typeof extendedColors.light];
    if (oklch) {
      lines.push(`  --${cssVar}: ${oklch};`);
    }
  }

  // Static light colors
  for (const [cssVar, oklch] of Object.entries(staticLightColors)) {
    lines.push(`  --${cssVar}: ${oklch};`);
  }

  lines.push(`}`);
  lines.push(``);

  // Dark mode (.dark)
  lines.push(`.dark {`);

  // From shared theme
  for (const [key, cssVar] of Object.entries(colorMapping)) {
    const oklch = oklchColors.dark[key as keyof typeof oklchColors.dark];
    if (oklch) {
      lines.push(`  --${cssVar}: ${oklch};`);
    }
  }

  // Extended colors
  for (const [key, cssVar] of Object.entries(extendedColorMapping)) {
    const oklch = extendedColors.dark[key as keyof typeof extendedColors.dark];
    if (oklch) {
      lines.push(`  --${cssVar}: ${oklch};`);
    }
  }

  // Dark-only colors from shared theme
  for (const [key, cssVar] of Object.entries(darkOnlyColorMapping)) {
    const oklch = oklchColors.dark[key as keyof typeof oklchColors.dark];
    if (oklch) {
      lines.push(`  --${cssVar}: ${oklch};`);
    }
  }

  // Static dark colors
  for (const [cssVar, oklch] of Object.entries(staticDarkColors)) {
    lines.push(`  --${cssVar}: ${oklch};`);
  }

  lines.push(`}`);
  lines.push(``);

  // Base layer
  lines.push(`@layer base {`);
  lines.push(`  * {`);
  lines.push(`    @apply border-border outline-ring/50;`);
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

console.log(`Generated ${outputPath}`);
console.log(
  `  Light mode: ${Object.keys(colorMapping).length + Object.keys(extendedColorMapping).length + Object.keys(staticLightColors).length} colors`
);
console.log(
  `  Dark mode: ${Object.keys(colorMapping).length + Object.keys(extendedColorMapping).length + Object.keys(darkOnlyColorMapping).length + Object.keys(staticDarkColors).length} colors`
);
