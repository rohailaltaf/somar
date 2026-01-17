import { forwardRef } from "react";
import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/src/lib/utils";

/**
 * Badge variants matching shadcn/ui Badge component.
 */
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

export interface BadgeProps extends ViewProps {
  /** Badge style variant */
  variant?: BadgeVariant;
  /** Badge content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Additional text class names (when children is string) */
  textClassName?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary border-transparent",
  secondary: "bg-secondary border-transparent",
  destructive: "bg-destructive border-transparent",
  outline: "bg-transparent border-border",
  success: "bg-success/20 border-success/30",
};

const variantTextStyles: Record<BadgeVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-white",
  outline: "text-foreground",
  success: "text-success",
};

/**
 * Badge component matching shadcn/ui API.
 *
 * @example
 * // Default badge
 * <Badge>New</Badge>
 *
 * // Secondary badge
 * <Badge variant="secondary">Draft</Badge>
 *
 * // Destructive badge
 * <Badge variant="destructive">Overdue</Badge>
 *
 * // Outline badge
 * <Badge variant="outline">Pending</Badge>
 */
export const Badge = forwardRef<View, BadgeProps>(
  (
    { variant = "default", children, className, textClassName, ...props },
    ref
  ) => {
    return (
      <View
        ref={ref}
        className={cn(
          "flex-row items-center justify-center rounded-full border px-2 py-0.5",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {typeof children === "string" ? (
          <Text
            className={cn(
              "text-xs font-medium",
              variantTextStyles[variant],
              textClassName
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    );
  }
);

Badge.displayName = "Badge";
