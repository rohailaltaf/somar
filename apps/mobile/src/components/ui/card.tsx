import { View, Text, Pressable } from "react-native";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
}

/**
 * Base card component with consistent styling.
 */
export function Card({ children, className = "", onPress }: CardProps) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      className={`bg-card rounded-2xl border border-border ${className}`}
      onPress={onPress}
      style={onPress ? { opacity: 1 } : undefined}
    >
      {children}
    </Wrapper>
  );
}

/**
 * Card with header and optional action.
 */
export function CardWithHeader({
  title,
  action,
  onActionPress,
  children,
  className = "",
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
        <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </Text>
        {action && (
          <Pressable onPress={onActionPress}>
            <Text className="text-sm font-medium text-primary">{action}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </Card>
  );
}

/**
 * Stat card for displaying a single metric.
 */
export function StatCard({
  label,
  value,
  subtitle,
  trend,
  onPress,
}: {
  label: string;
  value: ReactNode;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  onPress?: () => void;
}) {
  return (
    <Card className="p-5" onPress={onPress}>
      <Text className="text-sm font-medium text-muted-foreground mb-1">
        {label}
      </Text>
      <View className="flex-row items-baseline">
        {typeof value === "string" ? (
          <Text className="text-2xl font-bold text-foreground">{value}</Text>
        ) : (
          value
        )}
      </View>
      {(subtitle || trend) && (
        <View className="flex-row items-center mt-1">
          {trend && (
            <Text
              className={`text-sm font-medium ${
                trend.positive ? "text-success" : "text-destructive"
              } mr-2`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </Text>
          )}
          {subtitle && (
            <Text className="text-sm text-muted-foreground">{subtitle}</Text>
          )}
        </View>
      )}
    </Card>
  );
}
