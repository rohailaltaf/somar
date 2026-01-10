import { Text } from "react-native";
import { useAmountDisplay, type AmountColorMode } from "@somar/shared/ui-logic";

interface AmountDisplayProps {
  amount: number;
  /** Show sign (+/-) */
  showSign?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "display";
  /** Override color behavior - always show as expense/income/neutral */
  colorMode?: AmountColorMode;
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
  // Use shared hook for amount display logic
  const { display, colorClass } = useAmountDisplay(amount, {
    showSign,
    showCents: true,
    colorMode,
  });

  return (
    <Text className={`${sizeStyles[size]} ${fontWeightStyles[size]} ${colorClass}`}>
      {display}
    </Text>
  );
}
