import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DiagnosisClass } from "@/types";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import * as Haptics from "expo-haptics";

interface ClassProbabilityListProps {
  classProbabilities: Record<DiagnosisClass, number>;
  predictedClass: DiagnosisClass;
}

export function ClassProbabilityList({
  classProbabilities = {} as Record<DiagnosisClass, number>,
  predictedClass = "mel",
}: ClassProbabilityListProps) {
  const [expanded, setExpanded] = useState(false);

  const safeProbabilities = classProbabilities || {};

  // Sort classes by probability descending
  const sortedClasses = Object.entries(safeProbabilities).sort(
    ([, a], [, b]) => (b as number) - (a as number)
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
        className="flex-row items-center justify-between py-1"
      >
        <View>
          <Text className="text-base font-bold text-[#1B2B4B] dark:text-slate-100">
            All Diagnostic Classes
          </Text>
          <Text className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Full probability breakdown across all 7 classes
          </Text>
        </View>
        <View className="flex-row items-center bg-[#E6F7F5] dark:bg-teal-950/40 px-2.5 py-1 rounded-full">
          <Text className="text-xs font-bold text-[#0D9E94] dark:text-teal-300 mr-1">
            {expanded ? "Collapse" : "Expand"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={14}
            color="#0D9E94"
          />
        </View>
      </Pressable>

      {expanded && (
        <View className="gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
          {sortedClasses.map(([cls, prob]) => {
            const info = DIAGNOSIS_LABELS[cls] || {
              name: cls,
              shortName: cls?.toUpperCase() || "UNK",
              malignant: false,
            };
            const isPredicted = cls === predictedClass;
            const rawPercentage = Math.round(prob * 100);
            const displayPercentage = prob > 0 && rawPercentage === 0 ? 1 : rawPercentage;
            const barWidth = prob > 0 ? Math.max(displayPercentage, 3) : 0;

            const labelStyle = isPredicted
              ? "font-bold text-[#1B2B4B] dark:text-slate-100"
              : "text-[#64748B] dark:text-slate-400";

            const progressStyle = isPredicted
              ? "bg-[#0D9E94] dark:bg-[#2DD4BF]"
              : "bg-[#CBD5E1] dark:bg-slate-700";

            const percentStyle = isPredicted
              ? "font-bold text-[#0D9E94] dark:text-teal-400"
              : "text-[#64748B] dark:text-slate-400";

            return (
              <View key={cls} className="flex-row items-center">
                <View className="w-24 flex-row items-center">
                  <Text className={`text-sm ${labelStyle}`}>{info.shortName}</Text>
                  {isPredicted && (
                    <View className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[#0D9E94] dark:bg-[#2DD4BF]" />
                  )}
                </View>
                <View className="flex-1 mx-3">
                  <View className="h-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${progressStyle}`}
                      style={{
                        width: `${barWidth}%`,
                      }}
                    />
                  </View>
                </View>
                <Text className={`text-sm w-12 text-right ${percentStyle}`}>
                  {rawPercentage}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

