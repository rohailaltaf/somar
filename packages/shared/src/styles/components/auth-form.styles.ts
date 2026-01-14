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
    wrapper: "flex-1 bg-background items-center justify-center p-4",
    emailBox: "bg-surface-elevated rounded-lg p-4 mb-6",
    emailLabel: "text-sm text-muted-foreground mb-1",
    emailValue: "text-foreground font-medium",
    description: "text-sm text-muted-foreground text-center mb-6",
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
