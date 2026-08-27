/**
 * Badge component — color-coded risk tier badges.
 */

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
      className={`rounded-full self-start ${sizeStyles[size]}`}
      style={{ backgroundColor: config.bgColor }}
    >
      <Text
        className={`font-semibold ${textSizeStyles[size]}`}
        style={{ color: config.color }}
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
  const config = {
    synced: { label: "Synced", bg: "#DCFCE7", color: "#16A34A" },
    pending: { label: "Pending", bg: "#FEF3C7", color: "#D97706" },
    failed: { label: "Failed", bg: "#FEE2E2", color: "#DC2626" },
  };

  const c = config[status];
  const sizeStyle = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const textStyle = size === "sm" ? "text-xs" : "text-sm";

  return (
    <View
      className={`rounded-full self-start ${sizeStyle}`}
      style={{ backgroundColor: c.bg }}
    >
      <Text className={`font-medium ${textStyle}`} style={{ color: c.color }}>
        {c.label}
      </Text>
    </View>
  );
}
