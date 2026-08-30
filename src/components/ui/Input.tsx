import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  multiline = false,
  numberOfLines = 1,
  editable = true,
  rightIcon,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? "border-red-400 dark:border-red-500"
    : isFocused
      ? "border-primary"
      : "border-gray-200 dark:border-slate-800";

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-navy dark:text-slate-200 mb-1.5">{label}</Text>
      )}
      <View
        className={`flex-row items-center border rounded-xl bg-white dark:bg-slate-900 px-3 ${borderColor} ${
          multiline ? "py-2" : ""
        }`}
      >
        {icon && <View className="mr-2 opacity-70">{icon}</View>}
        <TextInput
          className={`flex-1 text-base text-navy dark:text-slate-100 ${multiline ? "py-2 min-h-[80px]" : "py-3"}`}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2 p-1"
          >
            <Text className="text-sm text-gray-400 dark:text-gray-500">
              {showPassword ? "Hide" : "Show"}
            </Text>
          </Pressable>
        )}
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && <Text className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</Text>}
    </View>
  );
}
