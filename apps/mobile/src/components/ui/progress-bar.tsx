import { View, Text } from "react-native";

/**
 * Progress bar for budget tracking.
 */
export function ProgressBar({
  progress,
  color = "primary",
  showLabel = false,
  size = "md",
}: {
  progress: number; // 0-1
  color?: "primary" | "success" | "warning" | "destructive";
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(clampedProgress * 100);

  const heightClass = size === "sm" ? "h-1.5" : "h-2";
  const colorClasses = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };

  // Auto-determine color based on progress if not specified
  const autoColor =
    progress > 1
      ? "destructive"
      : progress > 0.9
        ? "warning"
        : progress > 0.7
          ? "primary"
          : "success";
  const barColor = color === "primary" ? autoColor : color;

  return (
    <View>
      <View className={`w-full ${heightClass} bg-muted rounded-full overflow-hidden`}>
        <View
          className={`h-full ${colorClasses[barColor]} rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </View>
      {showLabel && (
        <Text className="text-xs text-muted-foreground mt-1">{percentage}%</Text>
      )}
    </View>
  );
}
