import { View, Text } from "react-native";
import { FolderOpen, Receipt, Search, type LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-6">
        <Icon size={36} color="#94a3b8" />
      </View>
      <Text className="text-xl font-semibold text-foreground text-center mb-2">
        {title}
      </Text>
      <Text className="text-base text-muted-foreground text-center leading-6 max-w-xs">
        {description}
      </Text>
      {action && (
        <Text
          className="text-base font-semibold text-primary mt-6"
          onPress={action.onPress}
        >
          {action.label}
        </Text>
      )}
    </View>
  );
}

/**
 * Transactions-specific empty state.
 */
export function TransactionsEmptyState() {
  return (
    <EmptyState
      icon={Receipt}
      title="No transactions yet"
      description="Connect your bank account or import transactions from CSV on the web app to get started."
    />
  );
}

/**
 * Search empty state.
 */
export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any transactions matching "${query}". Try a different search term.`}
    />
  );
}
