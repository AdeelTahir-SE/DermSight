import React, { useEffect, useState } from "react";
import { ABCDPanel } from "@/components/assessment/ABCDPanel";
import { ClassProbabilityList } from "@/components/assessment/ClassProbabilityList";
import { RiskTierBadge } from "@/components/assessment/RiskTierBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import { useAssessmentsStore } from "@/features/assessments/store";
import { useAuthStore } from "@/features/auth/store";
import type { InferenceResult } from "@/types";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

export default function ResultScreen() {
  const {
    result: resultParam,
    patientId,
    imageUri,
    assessmentId,
  } = useLocalSearchParams<{
    result?: string;
    patientId: string;
    imageUri?: string;
    assessmentId?: string;
  }>();

  const router = useRouter();
  const { saveAssessment } = useAssessmentsStore();
  const { userId } = useAuthStore();

  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (assessmentId) {
        // Load existing assessment from SQLite
        try {
          const { getAssessmentById } = await import("@/features/assessments/repository");
          const assessment = await getAssessmentById(assessmentId);
          if (assessment) {
            setInferenceResult({
              classProbabilities: assessment.classProbabilities,
              predictedClass: assessment.predictedClass,
              confidenceScore: assessment.confidenceScore,
              abcdScores: {
                asymmetry: assessment.abcdAsymmetry,
                border: assessment.abcdBorder,
                color: assessment.abcdColor,
                diameter: assessment.abcdDiameter,
              },
              riskTier: assessment.riskTier,
            });
            setDisplayImage(assessment.imageLocalUri);
          }
        } catch (e) {
          console.error("Failed to load historical assessment:", e);
        } finally {
          setLoading(false);
        }
      } else {
        // Load new inference result from parameters
        if (resultParam) {
          try {
            setInferenceResult(JSON.parse(resultParam));
          } catch (e) {
            console.error("Failed to parse resultParam:", e);
          }
        }
        if (imageUri) {
          setDisplayImage(imageUri);
        }
        setLoading(false);
      }
    }
    loadData();
  }, [assessmentId, resultParam, imageUri]);

  const defaultResult: InferenceResult = {
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

  const handleSave = async () => {
    if (!inferenceResult) return;
    setSaving(true);
    try {
      await saveAssessment(patientId, displayImage || imageUri || "", inferenceResult, userId);
      router.replace(`/(app)/patients/${patientId}`);
    } catch (e) {
      console.error("Failed to save assessment:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0D9E94" />
        <Text className="text-sm text-gray-500 mt-3">Loading assessment...</Text>
      </View>
    );
  }

  const result = inferenceResult || defaultResult;
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

          {/* Captured Lesion Image */}
          {displayImage ? (
            <View
              className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100"
              style={{ height: 200 }}
            >
              <Image
                source={{ uri: displayImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={300}
              />
            </View>
          ) : null}

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
        {assessmentId ? (
          <Button
            title="Go Back"
            onPress={() => router.back()}
          />
        ) : (
          <>
            <Button
              title="Save Result"
              onPress={handleSave}
              loading={saving}
              disabled={!displayImage || !inferenceResult}
            />
            <Button
              title="New Assessment"
              onPress={() => router.replace(`/(app)/patients/${patientId}/capture`)}
              variant="outline"
            />
          </>
        )}
      </View>
    </View>
  );
}
