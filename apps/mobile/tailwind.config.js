/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",

        // Surface hierarchy
        card: "rgb(var(--color-card) / <alpha-value>)",
        "card-foreground": "rgb(var(--color-card-foreground) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",

        // Muted/secondary
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-muted-foreground) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        "secondary-foreground": "rgb(var(--color-secondary-foreground) / <alpha-value>)",

        // Brand
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-foreground": "rgb(var(--color-primary-foreground) / <alpha-value>)",
        "primary-muted": "rgb(var(--color-primary-muted) / <alpha-value>)",

        // Semantic
        border: "rgb(var(--color-border) / <alpha-value>)",
        "border-subtle": "rgb(var(--color-border-subtle) / <alpha-value>)",
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        "destructive-muted": "rgb(var(--color-destructive-muted) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        "success-muted": "rgb(var(--color-success-muted) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        "warning-muted": "rgb(var(--color-warning-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",

        // Text hierarchy
        "text-primary": "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--color-text-tertiary) / <alpha-value>)",
        "text-inverse": "rgb(var(--color-text-inverse) / <alpha-value>)",

        // Overlay
        overlay: "rgb(var(--color-overlay) / <alpha-value>)",
      },
      // Custom spacing for premium feel
      spacing: {
        "4.5": "1.125rem", // 18px
        "5.5": "1.375rem", // 22px
        "18": "4.5rem",    // 72px
      },
      // Typography for fintech
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],   // 10px
        "display": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }], // 36px
        "title": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],      // 24px
        "headline": ["1.125rem", { lineHeight: "1.5rem", fontWeight: "600" }], // 18px
      },
      // Subtle shadows for depth
      boxShadow: {
        "soft": "0 2px 8px -2px rgba(0, 0, 0, 0.08)",
        "card": "0 4px 12px -4px rgba(0, 0, 0, 0.1)",
        "elevated": "0 8px 24px -8px rgba(0, 0, 0, 0.15)",
      },
      // Animation timing
      transitionDuration: {
        "250": "250ms",
      },
    },
  },
  plugins: [],
};
