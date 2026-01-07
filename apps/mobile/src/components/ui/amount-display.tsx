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

