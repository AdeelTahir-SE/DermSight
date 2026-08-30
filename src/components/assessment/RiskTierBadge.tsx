import React from "react";
import { View, Text } from "react-native";
import type { RiskTier } from "@/types";
import { RISK_TIER_CONFIG } from "@/constants/riskLevels";

interface RiskTierBadgeProps {
  riskTier: RiskTier;
  showAction?: boolean;
}

export function RiskTierBadge({ riskTier, showAction = false }: RiskTierBadgeProps) {
  const config = RISK_TIER_CONFIG[riskTier] || RISK_TIER_CONFIG.urgent_referral;

  // Map solid colored dots dynamically
  const dotColorClass =
    riskTier === "urgent_referral"
      ? "bg-red-500 dark:bg-red-400"
      : riskTier === "high"
        ? "bg-orange-500 dark:bg-orange-400"
        : riskTier === "medium"
          ? "bg-amber-500 dark:bg-amber-400"
          : "bg-green-500 dark:bg-green-400";

  return (
    <View className={`rounded-2xl p-4 ${config.bgColorClass || "bg-red-50 dark:bg-red-950/30"}`}>
      <View className="flex-row items-center mb-1">
        <View className={`w-3 h-3 rounded-full mr-2.5 ${dotColorClass}`} />
        <Text className={`text-lg font-bold ${config.textColorClass || "text-red-650"}`}>
          {config.label || "Referral Required"}
        </Text>
      </View>
      {showAction && (
        <Text className={`text-sm font-medium mt-1 leading-relaxed ${config.textColorClass || "text-red-650"} opacity-85`}>
          {config.action || "Please consult a specialist for confirmation."}
        </Text>
      )}
    </View>
  );
}
