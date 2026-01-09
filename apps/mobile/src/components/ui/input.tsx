import { forwardRef } from "react";
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
} from "react-native";
import { cn } from "@/src/lib/utils";
import { hexColors } from "@somar/shared/theme";

/**
 * Input component matching shadcn/ui Input API.
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter your name" />
 *
 * // With error state
 * <Input placeholder="Email" error="Invalid email address" />
 *
 * // Disabled
 * <Input placeholder="Disabled" disabled />
 */

export interface InputProps extends TextInputProps {
  /** Additional class names */
  className?: string;
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ className, error, label, editable = true, ...props }, ref) => {
    const isDisabled = editable === false;
    const hasError = !!error;

    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium text-foreground mb-1.5">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          editable={editable}
          className={cn(
            "h-10 w-full rounded-md border bg-transparent px-3 py-2",
            "text-base text-foreground",
            hasError ? "border-destructive" : "border-input",
            isDisabled && "opacity-50",
            className
          )}
          placeholderTextColor={hexColors.mutedForeground}
          {...props}
        />
        {error && (
          <Text className="text-sm text-destructive mt-1.5">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

/**
 * Textarea component for multi-line text input.
 */
export interface TextareaProps extends InputProps {
  /** Number of lines to show */
  numberOfLines?: number;
}

export const Textarea = forwardRef<TextInput, TextareaProps>(
  ({ className, numberOfLines = 4, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        className={cn("h-auto min-h-[100px] py-3", className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
