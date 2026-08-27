/**
 * ABCDPanel — 4-bar explainability panel showing Asymmetry, Border, Color, Diameter scores.
 * This is the differentiator of the app — mirroring the clinical ABCD concept from the H-CBM model.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { ABCD_LABELS } from '@/constants/riskLevels';

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
      <Text className="text-base font-semibold text-navy mb-1">ABCD Explainability</Text>
      <Text className="text-xs text-gray-500 mb-4">
        Visual clinical indicators used by the AI model.
      </Text>

      <View className="gap-4">
        {ABCD_LABELS.map((item, index) => {
          const value = scoreValues[index];
          const percentage = Math.round(value * 100);
          const barColor =
            value >= 0.7 ? '#DC2626' : value >= 0.4 ? '#D97706' : '#16A34A';

          return (
            <View key={item.key}>
              <View className="flex-row justify-between items-center mb-1">
                <View>
                  <Text className="text-sm font-medium text-navy">{item.label}</Text>
                  <Text className="text-xs text-gray-400">{item.description}</Text>
                </View>
                <Text className="text-sm font-bold" style={{ color: barColor }}>
                  {percentage}%
                </Text>
              </View>
              <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: barColor,
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
