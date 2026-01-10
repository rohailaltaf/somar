import { View, Text, Pressable } from "react-native";
import * as LucideIcons from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { hexColors } from "@somar/shared/theme";
import type {
  EmptyStateProps,
  SearchEmptyStateProps,
} from "@somar/shared/components";

const { FolderOpen } = LucideIcons;

/**
 * Resolve icon name to Lucide component.
 */
function resolveIcon(iconName: string): LucideIcon {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
  return Icon || FolderOpen;
}

const sizeConfig = {
  compact: { iconSize: 28, iconContainer: "w-14 h-14", spacing: "mb-4", textSize: "text-base" },
  default: { iconSize: 36, iconContainer: "w-20 h-20", spacing: "mb-6", textSize: "text-xl" },
  large: { iconSize: 48, iconContainer: "w-24 h-24", spacing: "mb-8", textSize: "text-2xl" },
};

/**
 * Empty state component implementing the shared contract.
 *
 * @example
 * <EmptyState icon="Wallet" title="No accounts" description="Add an account to get started" />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "default",
}: EmptyStateProps) {
  const Icon = resolveIcon(icon);
  const config = sizeConfig[size];

  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className={`${config.iconContainer} rounded-full bg-muted items-center justify-center ${config.spacing}`}>
        <Icon size={config.iconSize} color={hexColors.mutedForeground} />
      </View>
      <Text className={`${config.textSize} font-semibold text-foreground text-center mb-2`}>
        {title}
      </Text>
      <Text className="text-base text-muted-foreground text-center leading-6 max-w-xs">
        {description}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          className={`mt-6 px-4 py-2 rounded-lg ${
            action.variant === "outline"
              ? "border border-primary"
              : action.variant === "ghost"
              ? ""
              : "bg-primary"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              action.variant === "outline" || action.variant === "ghost"
                ? "text-primary"
                : "text-primary-foreground"
            }`}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Transactions-specific empty state.
 */
export function TransactionsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="Receipt"
      title="No transactions yet"
      description="Connect your bank account or import transactions from CSV on the web app to get started."
      action={onAction ? { label: "Get Started", onPress: onAction } : undefined}
    />
  );
}

/**
 * Search empty state.
 */
export function SearchEmptyState({ query, onClear }: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon="Search"
      title="No results found"
      description={`We couldn't find any transactions matching "${query}". Try a different search term.`}
      action={onClear ? { label: "Clear Search", onPress: onClear, variant: "ghost" } : undefined}
    />
  );
}

/**
 * No unconfirmed transactions empty state.
 */
export function NoUnconfirmedEmptyState() {
  return (
    <EmptyState
      icon="CheckCircle"
      title="All caught up!"
      description="You've categorized all your transactions. Great job!"
      size="compact"
    />
  );
}
