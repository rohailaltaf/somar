// UI Component Library

// Amount display
export { AmountDisplay } from "./amount-display";

// Progress bars
export { ProgressBar } from "./progress-bar";

// Section headers (DateSectionHeader stays in ui/, DashboardSectionHeader moved to dashboard/)
export { DateSectionHeader } from "./section-header";

// Badges and indicators
export { TrendBadge } from "./trend-badge";

// Empty states
export { EmptyState, TransactionsEmptyState, SearchEmptyState } from "./empty-state";

// Skeletons
export {
  Skeleton,
  TransactionRowSkeleton,
  TransactionsLoadingState,
} from "./skeleton";

// Forms
export { FormTextInput } from "./form-text-input";

// Screens
export { DecryptingScreen } from "./decrypting-screen";

// Core UI Components (shadcn-style)
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./button";
export { Badge, type BadgeProps, type BadgeVariant } from "./badge";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
  type CardTitleProps,
} from "./card";
export { Input, Textarea, type InputProps, type TextareaProps } from "./input";
