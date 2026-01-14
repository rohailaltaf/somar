/**
 * Auth form shared styles.
 * Used by login and register screens on both web and mobile.
 */

export const authFormStyles = {
  /** Card container */
  card: "rounded-xl border border-border bg-card p-6",

  /** Card with back button needs extra top padding */
  cardWithBack: "rounded-xl border border-border bg-card p-6 pt-12",

  /** Back button positioning */
  backButton: {
    container: "absolute left-4 top-4",
    text: "text-muted-foreground text-sm",
  },

  /** Header section */
  header: {
    container: "text-center mb-6",
    title: "text-2xl font-bold text-foreground text-center mb-2",
    subtitle: "text-sm text-muted-foreground text-center",
  },

  /** Divider between OAuth and email form */
  divider: {
    container: "flex flex-row items-center my-6",
    line: "flex-1 h-px bg-border",
    text: "text-muted-foreground px-3 text-xs uppercase",
  },

  /** Form fields */
  field: {
    container: "mb-4",
    label: "text-foreground text-sm mb-2",
    input: "bg-surface-elevated border border-border rounded-lg",
    inputError: "border-destructive",
    error: "text-destructive text-xs mt-1",
    helperText: "text-xs text-muted-foreground mt-1",
  },

  /** Error alert */
  error: {
    container: "bg-destructive/10 border border-destructive rounded-lg p-3 mb-4",
    text: "text-destructive text-sm text-center",
  },

  /** Buttons */
  button: {
    primary: "bg-primary rounded-lg py-3.5 items-center w-full",
    primaryDisabled: "bg-primary rounded-lg py-3.5 items-center w-full opacity-70",
    primaryText: "text-primary-foreground font-semibold text-base",
    oauth: "bg-foreground rounded-lg py-3 items-center w-full mb-6",
    oauthText: "text-background font-semibold text-base",
    ghost: "py-3 items-center w-full",
    ghostText: "text-muted-foreground text-sm",
    link: "text-primary text-sm",
  },

  /** Footer with sign up/sign in link */
  footer: {
    container: "flex flex-row justify-center items-center mt-6 gap-1",
    text: "text-muted-foreground text-sm",
    link: "text-primary text-sm font-medium",
  },

  /** OTP input styles */
  otp: {
    container: "flex flex-row justify-center gap-2 mb-6",
    slot: "w-12 h-14 border border-border rounded-lg text-center text-xl text-foreground bg-surface-elevated",
    slotActive: "border-primary ring-2 ring-primary",
    slotError: "border-destructive",
  },

  /** Loading state overlay */
  loading: {
    container: "fixed inset-0 flex flex-col items-center justify-center bg-surface-deep",
    spinner: "w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin",
    text: "text-xl font-semibold text-foreground mt-4",
    subtext: "text-muted-foreground",
  },

  /** Waitlist page styles */
  waitlist: {
    /** Main container */
    container: "relative min-h-screen flex flex-col items-center justify-center overflow-hidden",

    /** Atmospheric background */
    background: {
      wrapper: "fixed inset-0 pointer-events-none overflow-hidden",
      nebulaPrimary:
        "absolute top-[-30%] left-[-20%] w-[80vw] h-[80vh] rounded-full blur-[180px] animate-breathe",
      nebulaSecondary:
        "absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vh] rounded-full blur-[150px] animate-breathe",
      nebulaAccent:
        "absolute top-[20%] right-[10%] w-[30vw] h-[30vh] rounded-full blur-[120px] animate-breathe",
      gridOverlay: "absolute inset-0 opacity-[0.015]",
    },

    /** Content wrapper */
    content: "relative z-10 flex flex-col items-center px-6 max-w-lg mx-auto",

    /** Status indicator */
    statusBadge:
      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wide uppercase mb-8",
    statusDot: "w-2 h-2 rounded-full animate-pulse",

    /** Hero section */
    hero: {
      container: "text-center mb-10",
      title: "font-serif text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight mb-4",
      titleItalic: "font-serif italic text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight mb-4",
      subtitle: "text-lg sm:text-xl text-foreground-secondary max-w-md mx-auto leading-relaxed",
    },

    /** Email card with glow effect */
    emailCard: {
      outer:
        "relative rounded-2xl p-[1px] mb-8 w-full max-w-sm animate-float",
      gradient:
        "absolute inset-0 rounded-2xl opacity-60",
      inner:
        "relative rounded-2xl bg-card/95 backdrop-blur-sm p-6 border border-border/50",
      label: "text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2",
      email: "text-lg font-medium text-foreground truncate",
      iconWrapper:
        "absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center",
    },

    /** Info section */
    info: {
      container: "text-center mb-10 max-w-sm",
      text: "text-sm text-muted-foreground leading-relaxed",
      highlight: "text-foreground font-medium",
    },

    /** Feature preview box */
    featurePreview:
      "flex flex-row items-center gap-3 mb-10 px-5 py-3 rounded-xl",

    /** Decorative elements */
    orb: {
      container: "absolute w-1 h-1 rounded-full",
      glow: "absolute inset-0 rounded-full blur-sm",
    },

    /** Sign out button */
    signOutButton:
      "group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground",
    signOutButtonBg:
      "absolute inset-0 rounded-xl bg-surface-elevated/0 group-hover:bg-surface-elevated/80 transition-all duration-300",

    /** Color values (oklch for web, hex for mobile) */
    colors: {
      oklch: {
        // Atmospheric background
        nebulaPrimary: "oklch(0.25 0.15 280 / 0.15)",
        nebulaSecondary: "oklch(0.30 0.12 250 / 0.12)",
        nebulaAccent: "oklch(0.45 0.08 75 / 0.08)",
        gridLine: "oklch(0.5 0.02 260)",

        // Floating orbs
        orb: "oklch(0.65 0.18 260 / 0.6)",
        orbGlow: "oklch(0.65 0.18 260 / 0.4)",

        // Status badge (success green)
        statusBadgeBg: "oklch(0.25 0.08 145 / 0.3)",
        statusBadgeText: "oklch(0.75 0.15 145)",
        statusDot: "oklch(0.7 0.15 145)",

        // Hero text
        heroText: "oklch(0.95 0.01 260)",
        heroGradientStart: "oklch(0.78 0.12 75)",
        heroGradientEnd: "oklch(0.65 0.18 260)",

        // Email card gradient border
        cardGradientStart: "oklch(0.65 0.18 260 / 0.5)",
        cardGradientMid: "oklch(0.45 0.12 280 / 0.3)",
        cardGradientEnd: "oklch(0.78 0.12 75 / 0.4)",

        // Checkmark icon
        checkmarkBg: "oklch(0.25 0.08 145)",
        checkmarkGlow: "oklch(0.7 0.15 145 / 0.3)",
        checkmarkIcon: "oklch(0.75 0.15 145)",

        // Feature preview
        featurePreviewBg: "oklch(0.15 0.02 260 / 0.6)",
        featurePreviewBorder: "oklch(0.25 0.02 260 / 0.5)",
        featurePreviewIcon: "oklch(0.78 0.12 75)",
      },
      hex: {
        // Atmospheric background (pre-computed)
        nebulaPrimary: "#3d2d6b26",
        nebulaSecondary: "#3a3a701f",
        nebulaAccent: "#8b7a4514",
        gridLine: "#6b6b80",

        // SVG nebula colors (solid, opacity applied via stopOpacity)
        nebulaPrimarySolid: "#4a3a8a",
        nebulaSecondarySolid: "#3a4a70",
        nebulaAccentSolid: "#8b7a45",

        // Floating orbs
        orb: "#5b6ee199",
        orbGlow: "#5b6ee166",

        // Status badge (success green)
        statusBadgeBg: "#2d5a4d4d",
        statusBadgeText: "#5dc090",
        statusDot: "#4db87f",

        // Hero text
        heroText: "#f0f0f5",
        heroGradientStart: "#d4b66c",
        heroGradientEnd: "#5b6ee1",

        // Email card
        cardGradientStart: "#5b6ee180",
        cardGradientMid: "#4a4a8a4d",
        cardGradientEnd: "#d4b66c66",
        cardSurface: "#10121df2",
        cardSurfaceSolid: "#10121d",

        // Checkmark icon
        checkmarkBg: "#2d5a4d",
        checkmarkGlow: "#4db87f4d",
        checkmarkIcon: "#5dc090",

        // Feature preview
        featurePreviewBg: "#1a1a2699",
        featurePreviewBorder: "#33334080",
        featurePreviewIcon: "#d4b66c",

        // Muted foreground (for icons)
        mutedForeground: "#949aaa",
      },
    },
  },

  /** Numeric values for inline styles */
  spacing: {
    inputHeight: 48,
    inputPaddingHorizontal: 16,
    buttonPaddingVertical: 14,
    otpSlotWidth: 48,
    otpSlotHeight: 56,
  },
} as const;

/**
 * Get input container class based on error state.
 */
export function getInputClass(hasError: boolean): string {
  return `${authFormStyles.field.input} ${hasError ? authFormStyles.field.inputError : ""}`;
}

/**
 * Get button class based on disabled state.
 */
export function getButtonClass(isDisabled: boolean): string {
  return isDisabled ? authFormStyles.button.primaryDisabled : authFormStyles.button.primary;
}
