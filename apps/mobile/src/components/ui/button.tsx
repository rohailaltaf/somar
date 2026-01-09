import { forwardRef } from "react";
import {
  Pressable,
  Text,
  type PressableProps,
  type ViewStyle,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/src/lib/utils";
import { hexColors } from "@somar/shared/theme";

/**
 * Button variants matching shadcn/ui Button component.
 */
export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends Omit<PressableProps, "children"> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button content - string or React nodes */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Additional text class names (when children is string) */
  textClassName?: string;
  /** Loading state */
  loading?: boolean;
  /** Disable haptic feedback */
  noHaptics?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-primary",
  destructive: "bg-destructive",
  outline: "border border-border bg-transparent",
  secondary: "bg-secondary",
  ghost: "bg-transparent",
  link: "bg-transparent",
};

const variantTextStyles: Record<ButtonVariant, string> = {
  default: "text-primary-foreground",
  destructive: "text-white",
  outline: "text-foreground",
  secondary: "text-secondary-foreground",
  ghost: "text-foreground",
  link: "text-primary underline",
};

const variantPressedStyles: Record<ButtonVariant, string> = {
  default: "bg-primary/80",
  destructive: "bg-destructive/80",
  outline: "bg-accent",
  secondary: "bg-secondary/80",
  ghost: "bg-accent/50",
  link: "opacity-70",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3",
  lg: "h-12 px-6",
  icon: "h-10 w-10",
};

const sizeTextStyles: Record<ButtonSize, string> = {
  default: "text-sm",
  sm: "text-xs",
  lg: "text-base",
  icon: "text-sm",
};

/**
 * Button component matching shadcn/ui API.
 *
 * @example
 * // Primary button
 * <Button onPress={handlePress}>Click me</Button>
 *
 * // Destructive button
 * <Button variant="destructive" onPress={handleDelete}>Delete</Button>
 *
 * // Outline button with loading
 * <Button variant="outline" loading>Saving...</Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon"><Settings /></Button>
 */
export const Button = forwardRef<typeof Pressable, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      children,
      className,
      textClassName,
      loading = false,
      disabled,
      noHaptics = false,
      onPress,
      ...props
    },
    ref
  ) => {
    const handlePress = (e: any) => {
      if (disabled || loading) return;
      if (!noHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
    };

    const isDisabled = disabled || loading;

    return (
      <Pressable
        ref={ref as any}
        onPress={handlePress}
        disabled={isDisabled}
        className={(({ pressed }: { pressed: boolean }) =>
          cn(
            "flex-row items-center justify-center rounded-md",
            variantStyles[variant],
            sizeStyles[size],
            pressed && variantPressedStyles[variant],
            isDisabled && "opacity-50",
            className
          )
        ) as unknown as string}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === "default" || variant === "destructive"
                ? hexColors.primaryForeground
                : hexColors.foreground
            }
          />
        ) : typeof children === "string" ? (
          <Text
            className={cn(
              "font-medium",
              variantTextStyles[variant],
              sizeTextStyles[size],
              textClassName
            )}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
