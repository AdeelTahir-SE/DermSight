/**
 * Button component — primary, secondary, and outline variants.
 * Uses NativeWind for styling.
 */

import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  fullWidth = true,
}: ButtonProps) {
  const baseStyle =
    "flex-row items-center justify-center rounded-xl font-semibold";

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3.5",
    lg: "px-8 py-4",
  };

  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-primary-50",
    outline: "border-2 border-primary bg-white",
    danger: "bg-red-50",
  };

  const textVariantStyles = {
    primary: "text-white",
    secondary: "text-primary",
    outline: "text-primary",
    danger: "text-red-600",
  };

  const disabledStyle = disabled ? "opacity-50" : "";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        ${baseStyle}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabledStyle}
        ${fullWidth ? "w-full" : ""}
      `}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#0D9E94"}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            className={`
              font-semibold text-base
              ${textVariantStyles[variant]}
              ${icon ? "ml-2" : ""}
              ${iconRight ? "mr-2" : ""}
            `}
          >
            {title}
          </Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}
