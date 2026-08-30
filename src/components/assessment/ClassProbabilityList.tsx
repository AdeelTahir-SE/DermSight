import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { DiagnosisClass } from "@/types";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import * as Haptics from "expo-haptics";

interface ClassProbabilityListProps {
  classProbabilities: Record<DiagnosisClass, number>;
  predictedClass: DiagnosisClass;
}

export function ClassProbabilityList({
  classProbabilities,
  predictedClass,
}: ClassProbabilityListProps) {
  const [expanded, setExpanded] = useState(false);

  // Sort classes by probability descending
  const sortedClasses = Object.entries(classProbabilities).sort(
    ([, a], [, b]) => b - a
  ) as [DiagnosisClass, number][];

  const handleExpandToggle = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setExpanded(!expanded);
  };

  return (
    <View>
      <Pressable
        onPress={handleExpandToggle}
        className="flex-row items-center justify-between py-2"
      >
        <Text className="text-base font-semibold text-navy dark:text-slate-100">
          All Diagnostic Classes
        </Text>
        <Text className="text-sm font-semibold text-primary dark:text-primary-400">
          {expanded ? "Collapse" : "Expand"}
        </Text>
      </Pressable>
      <Text className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Full probability breakdown across all 7 classes.
      </Text>

      {expanded && (
        <View className="gap-3">
          {sortedClasses.map(([cls, prob]) => {
            const info = DIAGNOSIS_LABELS[cls];
            const isPredicted = cls === predictedClass;
            const percentage = Math.round(prob * 100);

            const labelStyle = isPredicted
              ? "font-bold text-navy dark:text-slate-100"
              : "text-gray-600 dark:text-slate-400";

            const progressStyle = isPredicted
              ? "bg-primary dark:bg-primary-500"
              : "bg-slate-350 dark:bg-slate-700";

            const percentStyle = isPredicted
              ? "font-bold text-primary dark:text-primary-450"
              : "text-gray-500 dark:text-slate-400";

            return (
              <View key={cls} className="flex-row items-center">
                <View className="w-24 flex-row items-center">
                  <Text className={`text-sm ${labelStyle}`}>{info.shortName}</Text>
                  {isPredicted && (
                    <View className="ml-1.5 w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary-400" />
                  )}
                </View>
                <View className="flex-1 mx-3">
                  <View className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${progressStyle}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </View>
                </View>
                <Text className={`text-sm w-12 text-right ${percentStyle}`}>
                  {percentage}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
