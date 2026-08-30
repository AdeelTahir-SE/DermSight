import React from "react";
import { View, type ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  padded?: boolean;
}

export function Card({
  children,
  style,
  className = "",
  padded = true,
}: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800/80 ${
        padded ? "p-4" : ""
      } ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
