import { RISK_TIER_CONFIG } from "@/constants/riskLevels";
import type { RiskTier } from "@/types";
import { Text, View } from "react-native";

interface BadgeProps {
  riskTier: RiskTier;
  size?: "sm" | "md" | "lg";
}

export function Badge({ riskTier, size = "md" }: BadgeProps) {
  const config = RISK_TIER_CONFIG[riskTier];

  const sizeStyles = {
    sm: "px-2 py-0.5",
    md: "px-3 py-1",
    lg: "px-4 py-1.5",
  };

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <View
      className={`rounded-full self-start ${sizeStyles[size]} ${config.bgColorClass}`}
    >
      <Text
        className={`font-semibold ${textSizeStyles[size]} ${config.textColorClass}`}
      >
        {config.label}
      </Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: "synced" | "pending" | "failed";
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const statusStyles = {
    synced: {
      bg: "bg-green-50 dark:bg-green-950/20 border border-green-100/50 dark:border-green-900/20",
      text: "text-green-700 dark:text-green-400",
      label: "Synced",
    },
    pending: {
      bg: "bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/20",
      text: "text-amber-700 dark:text-amber-400",
      label: "Pending",
    },
    failed: {
      bg: "bg-red-50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/20",
      text: "text-red-700 dark:text-red-400",
      label: "Failed",
    },
  };

  const current = statusStyles[status];
  const sizeStyle = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const textStyle = size === "sm" ? "text-xs" : "text-sm";

  return (
    <View className={`rounded-full self-start ${sizeStyle} ${current.bg}`}>
      <Text className={`font-semibold ${textStyle} ${current.text}`}>
        {current.label}
      </Text>
    </View>
  );
}
