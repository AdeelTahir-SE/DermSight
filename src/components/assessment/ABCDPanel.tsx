import React from "react";
import { View, Text } from "react-native";
import { ABCD_LABELS } from "@/constants/riskLevels";

interface ABCDPanelProps {
  scores: {
    asymmetry: number;
    border: number;
    color: number;
    diameter: number;
  };
}

export function ABCDPanel({ scores }: ABCDPanelProps) {
  const scoreValues = [
    scores.asymmetry,
    scores.border,
    scores.color,
    scores.diameter,
  ];

  return (
    <View>
      <Text className="text-base font-semibold text-navy dark:text-slate-100 mb-1">
        ABCD Explainability
      </Text>
      <Text className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Visual clinical indicators used by the AI model.
      </Text>

      <View className="gap-4">
        {ABCD_LABELS.map((item, index) => {
          const value = scoreValues[index];
          const percentage = Math.round(value * 100);

          const barColorClass =
            value >= 0.7
              ? "bg-red-500 dark:bg-red-650"
              : value >= 0.4
                ? "bg-orange-500 dark:bg-orange-650"
                : "bg-green-600 dark:bg-green-600";

          const textColorClass =
            value >= 0.7
              ? "text-red-500 dark:text-red-400"
              : value >= 0.4
                ? "text-orange-500 dark:text-orange-400"
                : "text-green-600 dark:text-green-400";

          return (
            <View key={item.key}>
              <View className="flex-row justify-between items-center mb-1.5">
                <View>
                  <Text className="text-sm font-medium text-navy dark:text-slate-200">
                    {item.label}
                  </Text>
                  <Text className="text-xs text-gray-400 dark:text-slate-500">
                    {item.description}
                  </Text>
                </View>
                <Text className={`text-sm font-bold ${textColorClass}`}>
                  {percentage}%
                </Text>
              </View>
              <View className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${barColorClass}`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
