import { View, Text, TextInput, type TextInputProps } from "react-native";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { colors } from "@/src/lib/theme";

interface FormTextInputProps<T extends FieldValues>
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
}

/**
 * Controlled TextInput integrated with React Hook Form.
 * Shows field-level validation errors inline.
 */
export function FormTextInput<T extends FieldValues>({
  control,
  name,
  label,
  ...textInputProps
}: FormTextInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <View className="mb-4">
          <Text className="text-foreground text-sm mb-2">{label}</Text>
          <TextInput
            className={`bg-muted border rounded-lg ${
              error ? "border-destructive" : "border-border"
            }`}
            style={{
              height: 48,
              paddingHorizontal: 16,
              fontSize: 16,
              color: colors.foreground,
            }}
            placeholderTextColor={colors.mutedForeground}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            {...textInputProps}
          />
          {error?.message && (
            <Text className="text-destructive text-xs mt-1">
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}
