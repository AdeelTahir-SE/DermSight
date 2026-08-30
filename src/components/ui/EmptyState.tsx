import React from "react";
import { Text, View } from "react-native";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {icon && <View className="mb-4 opacity-75">{icon}</View>}
      <Text className="text-lg font-semibold text-navy dark:text-slate-100 text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-gray-500 dark:text-slate-400 text-center mb-6">
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}
