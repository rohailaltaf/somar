import { View, Text, TextInput, type TextInputProps, useColorScheme } from "react-native";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

const colors = {
  light: {
    text: "#0f172a",
    placeholder: "#94a3b8",
  },
  dark: {
    text: "#f8fafc",
    placeholder: "#64748b",
  },
};

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
  const colorScheme = useColorScheme();
  const theme = colors[colorScheme ?? "light"];

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
              color: theme.text,
            }}
            placeholderTextColor={theme.placeholder}
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
