/**
 * ClassProbabilityList — collapsible 7-class probability breakdown.
 */

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { DiagnosisClass } from '@/types';
import { DIAGNOSIS_LABELS } from '@/constants/riskLevels';

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
  const sortedClasses = Object.entries(classProbabilities)
    .sort(([, a], [, b]) => b - a) as [DiagnosisClass, number][];

  return (
    <View>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between py-2"
      >
        <Text className="text-base font-semibold text-navy">All Diagnostic Classes</Text>
        <Text className="text-sm text-primary">{expanded ? 'Collapse' : 'Expand'}</Text>
      </Pressable>
      <Text className="text-xs text-gray-500 mb-3">
        Full probability breakdown across all 7 classes.
      </Text>

      {expanded && (
        <View className="gap-2">
          {sortedClasses.map(([cls, prob]) => {
            const info = DIAGNOSIS_LABELS[cls];
            const isPredicted = cls === predictedClass;
            const percentage = Math.round(prob * 100);

            return (
              <View key={cls} className="flex-row items-center">
                <View className="w-24 flex-row items-center">
                  <Text
                    className={`text-sm ${isPredicted ? 'font-bold text-navy' : 'text-gray-600'}`}
                  >
                    {info.shortName}
                  </Text>
                  {isPredicted && (
                    <View className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </View>
                <View className="flex-1 mx-3">
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: isPredicted ? '#0D9E94' : '#94A3B8',
                      }}
                    />
                  </View>
                </View>
                <Text
                  className={`text-sm w-12 text-right ${
                    isPredicted ? 'font-bold text-primary' : 'text-gray-500'
                  }`}
                >
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
