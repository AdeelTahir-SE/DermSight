import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RiskTier } from "@/types";
import { RISK_TIER_CONFIG } from "@/constants/riskLevels";

interface RiskTierBadgeProps {
  riskTier: RiskTier;
  showAction?: boolean;
}

export function RiskTierBadge({ riskTier, showAction = false }: RiskTierBadgeProps) {
  const config = RISK_TIER_CONFIG[riskTier] || RISK_TIER_CONFIG.urgent_referral;

  const iconName: keyof typeof Ionicons.glyphMap =
    riskTier === "urgent_referral"
      ? "alert-circle"
      : riskTier === "high"
        ? "alert-circle"
        : riskTier === "medium"
          ? "warning"
          : "shield-checkmark";

  return (
    <View className={`rounded-2xl p-4 ${config.bgColorClass || "bg-red-50 dark:bg-red-950/30"}`}>
      <View className="flex-row items-center mb-1">
        <Ionicons name={iconName} size={20} color={config.color} style={{ marginRight: 8 }} />
        <Text className={`text-base font-bold ${config.textColorClass || "text-red-650"}`}>
          {config.label || "Referral Required"}
        </Text>
      </View>
      {showAction && (
        <Text className={`text-xs font-medium mt-1 leading-relaxed ${config.textColorClass || "text-red-650"} opacity-90`}>
          {config.action || "Please consult a specialist for confirmation."}
        </Text>
      )}
    </View>
  );
}

