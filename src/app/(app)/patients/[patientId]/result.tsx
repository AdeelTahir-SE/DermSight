import React, { useEffect, useState } from "react";
import { ABCDPanel } from "@/components/assessment/ABCDPanel";
import { ClassProbabilityList } from "@/components/assessment/ClassProbabilityList";
import { RiskTierBadge } from "@/components/assessment/RiskTierBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import { useAssessmentsStore } from "@/features/assessments/store";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "@/features/notifications/toastStore";
import type { InferenceResult } from "@/types";
import { normalizeImageUri } from "@/utils/image";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export default function ResultScreen() {
  const {
    result: resultParam,
    patientId: rawPatientId,
    patientid: fallbackPatientId,
    imageUri,
    assessmentId,
  } = useLocalSearchParams<{
    result?: string;
    patientId?: string;
    patientid?: string;
    imageUri?: string;
    assessmentId?: string;
  }>();

  const patientId = rawPatientId || fallbackPatientId || "";

  const router = useRouter();
  const { saveAssessment, capturedImageUri, setCapturedImageUri } = useAssessmentsStore();
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
            let imgUri = assessment.imageLocalUri;
            if (imgUri && Platform.OS !== "web") {
              imgUri = normalizeImageUri(imgUri);
              try {
                const info = await FileSystem.getInfoAsync(imgUri);
                if (!info.exists && assessment.imageRemoteUrl) {
                  imgUri = assessment.imageRemoteUrl;
                }
              } catch {
                if (assessment.imageRemoteUrl) {
                  imgUri = assessment.imageRemoteUrl;
                }
              }
            } else if (!imgUri && assessment.imageRemoteUrl) {
              imgUri = assessment.imageRemoteUrl;
            }
            setDisplayImage(imgUri);
          }
        } catch (e) {
          console.error("Failed to load historical assessment:", e);
          toast.error("Failed to load assessment details.");
        } finally {
          setLoading(false);
        }
      } else {
        // Load new inference result from parameters
        if (resultParam) {
          try {
            const decoded = decodeURIComponent(resultParam);
            setInferenceResult(JSON.parse(decoded));
          } catch (e) {
            try {
              setInferenceResult(JSON.parse(resultParam));
            } catch (innerError) {
              console.error("Failed to parse resultParam:", innerError);
            }
          }
        }
        const activeUri = normalizeImageUri(capturedImageUri || imageUri || "");
        if (activeUri) {
          setDisplayImage(activeUri);
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
      await saveAssessment(patientId, displayImage || capturedImageUri || imageUri || "", inferenceResult, userId);
      setCapturedImageUri(null);
      toast.success("Assessment saved successfully!");
      router.replace(`/(app)/patients/${patientId}`);
    } catch (e) {
      console.error("Failed to save assessment:", e);
      toast.error("Failed to save assessment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.back();
  };

  const handleNewAssessment = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.replace(`/(app)/patients/${patientId}/capture`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#0D9E94" />
        <Text className="text-sm text-gray-500 dark:text-slate-400 mt-3 animate-pulse">Loading assessment...</Text>
      </View>
    );
  }

  const result = inferenceResult || defaultResult;
  const diagnosisInfo = DIAGNOSIS_LABELS[result.predictedClass];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800/80">
        <View className="flex-row items-center">
          <Pressable onPress={handleBack} className="p-1 mr-3">
            <Text className="text-xl text-navy dark:text-slate-100">←</Text>
          </Pressable>
          <Text className="text-lg font-bold text-navy dark:text-slate-100">Assessment Result</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5 gap-4">
          {/* Disclaimer */}
          <View className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl p-4 flex-row items-start">
            <Text className="text-sm mr-2.5">⚠️</Text>
            <Text className="text-xs text-amber-705 dark:text-amber-300 flex-1 leading-relaxed">
              This is a screening result, not a diagnosis. Always consult a specialist for confirmation.
            </Text>
          </View>

          {/* Captured Lesion Image */}
          {displayImage ? (
            <View
              className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900"
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
            <Text className="text-xs text-gray-500 dark:text-slate-400 mb-1">Top Diagnosis</Text>
            <Text className="text-lg font-bold text-navy dark:text-slate-100">
              {diagnosisInfo.name}
            </Text>
            <View className="flex-row items-center mt-2.5">
              <Text className="text-sm text-gray-500 dark:text-slate-450 mr-2">Confidence</Text>
              <Text className="text-base font-bold text-primary dark:text-primary-400">
                {Math.round(result.confidenceScore * 100)}%
              </Text>
            </View>
            {diagnosisInfo.malignant && (
              <View className="flex-row items-center mt-3 bg-red-50 dark:bg-red-950/25 border border-red-100/20 dark:border-red-900/20 rounded-xl p-3">
                <Text className="text-xs mr-2">⚠️</Text>
                <Text className="text-xs text-red-650 dark:text-red-400 font-semibold flex-1">
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
      <View className="px-5 pb-10 gap-3 bg-white dark:bg-slate-900 pt-3.5 border-t border-gray-100 dark:border-slate-800/80">
        {assessmentId ? (
          <Button
            title="Go Back"
            onPress={handleBack}
          />
        ) : (
          <>
            <Button
              title="Save Result"
              onPress={handleSave}
              loading={saving}
              disabled={saving || !displayImage || !inferenceResult}
            />
            <Button
              title="New Assessment"
              onPress={handleNewAssessment}
              disabled={saving}
              variant="outline"
            />
          </>
        )}
      </View>
    </View>
  );
}
