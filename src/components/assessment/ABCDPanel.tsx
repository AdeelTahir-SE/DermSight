import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ABCD_LABELS } from "@/constants/riskLevels";

interface ABCDPanelProps {
  scores: {
    asymmetry: number;
    border: number;
    color: number;
    diameter: number;
  };
}

const ABCD_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  asymmetry: "shapes-outline",
  border: "scan-outline",
  color: "color-palette-outline",
  diameter: "resize-outline",
};

export function ABCDPanel({ scores }: ABCDPanelProps) {
  const safeScores = scores || {
    asymmetry: 0,
    border: 0,
    color: 0,
    diameter: 0,
  };

  const scoreValues = [
    safeScores.asymmetry ?? 0,
    safeScores.border ?? 0,
    safeScores.color ?? 0,
    safeScores.diameter ?? 0,
  ];

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-base font-bold text-[#1B2B4B] dark:text-slate-100">
          ABCD Clinical Breakdown
        </Text>
        <Ionicons name="analytics-outline" size={18} color="#0D9E94" />
      </View>
      <Text className="text-xs text-[#64748B] dark:text-slate-400 mb-4">
        Visual dermoscopic indicators analyzed by the AI model.
      </Text>

      <View className="gap-3.5">
        {ABCD_LABELS.map((item, index) => {
          const value = scoreValues[index];
          const percentage = Math.round(value * 100);
          const icon = ABCD_ICONS[item.key] || "medical-outline";

          const isElevated = value >= 0.65;
          const barColor = isElevated ? "bg-[#0D9E94] dark:bg-[#2DD4BF]" : "bg-[#0D9E94]/70 dark:bg-[#2DD4BF]/70";
          const textColor = "text-[#1B2B4B] dark:text-slate-100";

          return (
            <View key={item.key}>
              <View className="flex-row justify-between items-center mb-1.5">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <View className="w-6 h-6 rounded-lg bg-[#E6F7F5] dark:bg-teal-950/40 items-center justify-center">
                    <Ionicons name={icon} size={13} color="#0D9E94" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-[#1B2B4B] dark:text-slate-200" numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text className="text-[11px] text-[#64748B] dark:text-slate-400" numberOfLines={1}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <Text className={`text-sm font-bold ${textColor}`}>
                  {percentage}%
                </Text>
              </View>
              <View className="h-2 bg-[#F1F5F9] dark:bg-slate-800 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${barColor}`}
                  style={{
                    width: `${Math.max(percentage, 4)}%`,
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

