/**
 * RiskTierBadge — prominent color-coded risk tier display.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { RiskTier } from '@/types';
import { RISK_TIER_CONFIG } from '@/constants/riskLevels';

interface RiskTierBadgeProps {
  riskTier: RiskTier;
  showAction?: boolean;
}

export function RiskTierBadge({ riskTier, showAction = false }: RiskTierBadgeProps) {
  const config = RISK_TIER_CONFIG[riskTier];

  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: config.bgColor }}>
      <View className="flex-row items-center mb-1">
        <View
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: config.color }}
        />
        <Text
          className="text-lg font-bold"
          style={{ color: config.color }}
        >
          {config.label}
        </Text>
      </View>
      {showAction && (
        <Text className="text-sm mt-1" style={{ color: config.color, opacity: 0.85 }}>
          {config.action}
        </Text>
      )}
    </View>
  );
}
