/**
 * Demo Plaid link shared styles.
 * Used by demo Plaid link components on both web and mobile.
 */

export interface DemoInstitution {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface DemoPlaidLinkProps {
  institutions: DemoInstitution[];
  onSelect: (institutionId: string, institutionName: string) => void;
  onClose: () => void;
}

export const demoPlaidLinkStyles = {
  /** Overlay */
  overlay: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",

  /** Modal container */
  modal: "bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl",

  /** Header */
  header: "flex flex-row items-center justify-between mb-6",
  title: "text-xl font-semibold text-foreground",
  closeButton: "p-2 rounded-lg hover:bg-muted transition-colors",

  /** Subtitle */
  subtitle: "text-sm text-muted-foreground mb-4",

  /** Bank list */
  bankList: "flex flex-col gap-3",

  /** Bank button */
  bankButton:
    "flex flex-row items-center gap-4 p-4 rounded-xl border border-border bg-surface-elevated hover:bg-muted transition-colors",

  /** Bank logo */
  bankLogoWrapper: "w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden",
  bankLogo: "w-10 h-10 object-contain",

  /** Bank info */
  bankInfo: "flex flex-col flex-1",
  bankName: "text-base font-medium text-foreground",
  bankType: "text-xs text-muted-foreground",

  /** Numeric values */
  dimensions: {
    logoSize: 48,
    logoInnerSize: 40,
    closeIconSize: 20,
    chevronSize: 16,
  },
} as const;
