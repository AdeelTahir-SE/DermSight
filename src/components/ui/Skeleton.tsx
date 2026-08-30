import { useEffect } from "react";
import { type DimensionValue, type ViewStyle } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  variant?: "circle" | "rect" | "line";
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  variant = "rect",
  className = "",
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.35, { duration: 800 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const variantClasses = {
    circle: "rounded-full",
    rect: "rounded-2xl",
    line: "rounded-md",
  };

  return (
    <Animated.View
      className={`bg-slate-200 dark:bg-slate-850 ${variantClasses[variant]} ${className}`}
      style={[
        {
          width,
          height,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
