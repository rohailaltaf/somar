import { Text, View } from "react-native";
import { useMemo } from "react";

interface AmountDisplayProps {
  amount: number;
  /** Show sign (+/-) */
  showSign?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "display";
  /** Override color behavior - always show as expense/income/neutral */
  colorMode?: "auto" | "expense" | "income" | "neutral";
}

const sizeStyles = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  display: "text-display",
};

const fontWeightStyles = {
  sm: "font-medium",
  md: "font-semibold",
  lg: "font-semibold",
  display: "font-bold",
};

export function AmountDisplay({
  amount,
  showSign = false,
  size = "md",
  colorMode = "auto",
}: AmountDisplayProps) {
  const formatted = useMemo(() => {
    const absAmount = Math.abs(amount);
    const str = absAmount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });

    if (showSign) {
      return amount < 0 ? `-${str}` : `+${str}`;
    }
    return str;
  }, [amount, showSign]);

  const colorClass = useMemo(() => {
    if (colorMode === "neutral") return "text-foreground";
    if (colorMode === "expense") return "text-destructive";
    if (colorMode === "income") return "text-success";
    // auto mode: negative = expense (red), positive = income (green)
    return amount < 0 ? "text-destructive" : "text-success";
  }, [amount, colorMode]);

  return (
    <Text className={`${sizeStyles[size]} ${fontWeightStyles[size]} ${colorClass}`}>
      {formatted}
    </Text>
  );
}

/**
 * Compact amount display for dashboard cards.
 * Shows the dollar and cents separately for visual hierarchy.
 */
export function AmountDisplayLarge({
  amount,
  colorMode = "neutral",
}: {
  amount: number;
  colorMode?: "auto" | "expense" | "income" | "neutral";
}) {
  const { dollars, cents, sign } = useMemo(() => {
    const absAmount = Math.abs(amount);
    const parts = absAmount.toFixed(2).split(".");
    return {
      dollars: Number(parts[0]).toLocaleString("en-US"),
      cents: parts[1],
      sign: amount < 0 ? "-" : "",
    };
  }, [amount]);

  const colorClass = useMemo(() => {
    if (colorMode === "neutral") return "text-foreground";
    if (colorMode === "expense") return "text-destructive";
    if (colorMode === "income") return "text-success";
    return amount < 0 ? "text-destructive" : "text-success";
  }, [amount, colorMode]);

  return (
    <View className="flex-row items-baseline">
      <Text className={`text-2xl font-bold ${colorClass}`}>
        {sign}$
      </Text>
      <Text className={`text-4xl font-bold ${colorClass}`}>
        {dollars}
      </Text>
      <Text className={`text-xl font-semibold text-muted-foreground`}>
        .{cents}
      </Text>
    </View>
  );
}
