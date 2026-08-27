/**
 * Risk Assessment Result screen — the differentiator of the app.
 * Shows 7-class diagnosis, mapped risk tier, ABCD explainability panel, recommended action.
 */

import { ABCDPanel } from "@/components/assessment/ABCDPanel";
import { ClassProbabilityList } from "@/components/assessment/ClassProbabilityList";
import { RiskTierBadge } from "@/components/assessment/RiskTierBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import type { InferenceResult } from "@/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ResultScreen() {
  const { result: resultParam, patientId } = useLocalSearchParams<{
    result?: string;
    patientId: string;
  }>();
  const router = useRouter();

  // Parse result from params or use demo data
  const result: InferenceResult = resultParam
    ? JSON.parse(resultParam)
    : {
        classProbabilities: {
          mel: 0.35,
          bcc: 0.15,
          akiec: 0.1,
          bkl: 0.12,
          df: 0.08,
          vasc: 0.05,
          nv: 0.15,
        },
        predictedClass: "mel",
        confidenceScore: 0.35,
        abcdScores: {
          asymmetry: 0.75,
          border: 0.62,
          color: 0.81,
          diameter: 0.45,
        },
        riskTier: "urgent_referral",
      };

  const diagnosisInfo = DIAGNOSIS_LABELS[result.predictedClass];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 mr-3">
            <Text className="text-xl">←</Text>
          </Pressable>
          <Text className="text-lg font-bold text-navy">Assessment Result</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5 gap-4">
          {/* Disclaimer */}
          <View className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex-row items-start">
            <Text className="text-sm mr-2">⚠️</Text>
            <Text className="text-xs text-amber-700 flex-1">
              This is a screening result, not a diagnosis. Always consult a
              specialist for confirmation.
            </Text>
          </View>

          {/* Risk Tier Badge */}
          <RiskTierBadge riskTier={result.riskTier} showAction />

          {/* Top Diagnosis */}
          <Card>
            <Text className="text-xs text-gray-500 mb-1">Top Diagnosis</Text>
            <Text className="text-lg font-bold text-navy">
              {diagnosisInfo.name}
            </Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-sm text-gray-500 mr-2">Confidence</Text>
              <Text className="text-base font-bold text-primary">
                {Math.round(result.confidenceScore * 100)}%
              </Text>
            </View>
            {diagnosisInfo.malignant && (
              <View className="flex-row items-center mt-2 bg-red-50 rounded-lg p-2">
                <Text className="text-xs mr-1">⚠️</Text>
                <Text className="text-xs text-red-600 font-medium">
                  Malignant classification
                </Text>
              </View>
            )}
          </Card>

          {/* Class Probability Breakdown */}
          <Card>
            <ClassProbabilityList
              classProbabilities={result.classProbabilities}
              predictedClass={result.predictedClass}
            />
          </Card>

          {/* ABCD Explainability Panel */}
          <Card>
            <ABCDPanel scores={result.abcdScores} />
          </Card>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View className="px-5 pb-10 gap-3 bg-white pt-3 border-t border-gray-100">
        <Button
          title="Save Result"
          onPress={() => router.replace(`/(app)/patients/${patientId}`)}
        />
        <Button
          title="New Assessment"
          onPress={() => router.replace(`/(app)/patients/${patientId}/capture`)}
          variant="outline"
        />
      </View>
    </View>
  );
}
