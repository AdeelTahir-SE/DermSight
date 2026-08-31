import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RiskTier } from "@/types";

interface RiskTierBadgeProps {
  riskTier: RiskTier;
  showAction?: boolean;
}

const SOLID_RISK_CONFIG: Record<
  RiskTier,
  {
    bg: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    action: string;
  }
> = {
  urgent_referral: {
    bg: "bg-[#DC2626]",
    icon: "alert-circle",
    label: "Urgent Referral Required",
    action: "Refer to specialist immediately. Priority clinical review.",
  },
  high: {
    bg: "bg-[#DC2626]",
    icon: "alert-circle",
    label: "High Risk Finding",
    action: "Refer within days. Schedule follow-up and monitor closely.",
  },
  medium: {
    bg: "bg-[#D97706]",
    icon: "warning",
    label: "Moderate Risk Finding",
    action: "Advise clinical monitoring. Re-screen at next follow-up visit.",
  },
  low: {
    bg: "bg-[#0D9E94]",
    icon: "shield-checkmark",
    label: "Low Risk Finding",
    action: "Routine observation. No immediate specialist referral required.",
  },
};

export function RiskTierBadge({ riskTier, showAction = true }: RiskTierBadgeProps) {
  const config = SOLID_RISK_CONFIG[riskTier] || SOLID_RISK_CONFIG.urgent_referral;

  return (
    <View className={`rounded-3xl p-5 ${config.bg} shadow-sm`}>
      <View className="flex-row items-start">
        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3 mt-0.5 shrink-0">
          <Ionicons name={config.icon} size={18} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-white tracking-tight leading-snug">
            {config.label}
          </Text>
          {showAction && (
            <Text className="text-xs font-medium text-white/95 leading-relaxed mt-1">
              {config.action}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}


