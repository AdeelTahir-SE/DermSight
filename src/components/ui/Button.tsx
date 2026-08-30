import React, { useEffect } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

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
    "flex-row items-center justify-center rounded-xl font-semibold overflow-hidden relative";

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3.5",
    lg: "px-8 py-4",
  };

  const variantStyles = {
    primary: "bg-primary dark:bg-primary-600",
    secondary: "bg-primary-50 dark:bg-primary-950/20",
    outline: "border border-primary dark:border-primary-500 bg-white dark:bg-slate-900",
    danger: "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30",
  };

  const textVariantStyles = {
    primary: "text-white",
    secondary: "text-primary dark:text-primary-400",
    outline: "text-primary dark:text-primary-400",
    danger: "text-red-600 dark:text-red-400",
  };

  const disabledStyle = disabled || loading ? "opacity-60" : "";

  // Dynamic values for the loading slider/progress bar
  const sliderContainerBg = variant === "primary" ? "bg-white/20" : "bg-primary-100 dark:bg-primary-950/40";
  const sliderBarBg = variant === "primary" ? "bg-white" : "bg-primary dark:bg-primary-400";

  const progress = useSharedValue(-50);

  useEffect(() => {
    if (loading) {
      progress.value = withRepeat(
        withSequence(
          withTiming(120, { duration: 1500 }),
          withTiming(-50, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      progress.value = -50;
    }
  }, [loading, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    left: `${progress.value}%`,
  }));

  const handlePress = async () => {
    if (disabled || loading) return;

    try {
      if (variant === "primary" || variant === "danger") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      // Safe check for web/simulator environments
    }

    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
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
      <View className="flex-row items-center justify-center">
        {icon && <View className="mr-2">{icon}</View>}
        <Text
          className={`
            font-semibold text-base
            ${textVariantStyles[variant]}
            ${iconRight ? "mr-2" : ""}
          `}
        >
          {title}
        </Text>
        {iconRight && <View className="ml-2">{iconRight}</View>}
      </View>

      {/* Premium Horizontal Progress Loading Slider */}
      {loading && (
        <View className={`absolute bottom-0 left-0 right-0 h-1 overflow-hidden ${sliderContainerBg}`}>
          <Animated.View
            className={`absolute top-0 bottom-0 w-[40%] ${sliderBarBg}`}
            style={progressStyle}
          />
        </View>
      )}
    </Pressable>
  );
}
