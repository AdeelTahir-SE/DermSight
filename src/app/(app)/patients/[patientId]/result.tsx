import React, { useEffect, useState } from "react";
import { ABCDPanel } from "@/components/assessment/ABCDPanel";
import { ClassProbabilityList } from "@/components/assessment/ClassProbabilityList";
import { RiskTierBadge } from "@/components/assessment/RiskTierBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DIAGNOSIS_LABELS, type DiagnosisClass } from "@/constants/riskLevels";
import { useAssessmentsStore } from "@/features/assessments/store";
import { useAuthStore } from "@/features/auth/store";
import { useThemeStore } from "@/features/theme/store";
import { toast } from "@/features/notifications/toastStore";
import type { InferenceResult } from "@/types";
import { normalizeImageUri } from "@/utils/image";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

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
            let parsedProbabilities = assessment.classProbabilities;
            if (typeof parsedProbabilities === "string") {
              try {
                parsedProbabilities = JSON.parse(parsedProbabilities);
              } catch {
                parsedProbabilities = {} as Record<DiagnosisClass, number>;
              }
            }

            setInferenceResult({
              classProbabilities: parsedProbabilities || ({} as Record<DiagnosisClass, number>),
              predictedClass: (assessment.predictedClass || "mel") as DiagnosisClass,
              confidenceScore: assessment.confidenceScore ?? 0.85,
              abcdScores: {
                asymmetry: assessment.abcdAsymmetry ?? 0.5,
                border: assessment.abcdBorder ?? 0.5,
                color: assessment.abcdColor ?? 0.5,
                diameter: assessment.abcdDiameter ?? 0.5,
              },
              riskTier: assessment.riskTier || "medium",
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
            if (typeof resultParam === "object") {
              setInferenceResult(resultParam);
            } else {
              let parsed: any;
              try {
                parsed = JSON.parse(decodeURIComponent(resultParam));
              } catch {
                parsed = JSON.parse(resultParam);
              }
              if (parsed && typeof parsed === "object") {
                setInferenceResult(parsed);
              }
            }
          } catch (e) {
            console.error("Failed to parse resultParam:", e);
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
  }, [assessmentId, resultParam, imageUri, capturedImageUri]);

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
    confidenceScore: 0.85,
    abcdScores: {
      asymmetry: 0.75,
      border: 0.62,
      color: 0.81,
      diameter: 0.45,
    },
    riskTier: "urgent_referral",
  };

  const safeResult: InferenceResult = {
    classProbabilities: inferenceResult?.classProbabilities || defaultResult.classProbabilities,
    predictedClass: (inferenceResult?.predictedClass || defaultResult.predictedClass) as DiagnosisClass,
    confidenceScore: inferenceResult?.confidenceScore ?? defaultResult.confidenceScore,
    abcdScores: {
      asymmetry: inferenceResult?.abcdScores?.asymmetry ?? defaultResult.abcdScores.asymmetry,
      border: inferenceResult?.abcdScores?.border ?? defaultResult.abcdScores.border,
      color: inferenceResult?.abcdScores?.color ?? defaultResult.abcdScores.color,
      diameter: inferenceResult?.abcdScores?.diameter ?? defaultResult.abcdScores.diameter,
    },
    riskTier: inferenceResult?.riskTier || defaultResult.riskTier,
  };

  const diagnosisInfo = DIAGNOSIS_LABELS[safeResult.predictedClass] || {
    name: "Screening Assessment",
    shortName: (safeResult.predictedClass || "UNK").toUpperCase(),
    malignant: false,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAssessment(
        patientId,
        displayImage || capturedImageUri || imageUri || "",
        safeResult,
        userId || "local-user",
      );
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

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
        {/* Header */}
        <View className="bg-white dark:bg-slate-900 px-5 pt-3 pb-4 border-b border-[#EBF2F1] dark:border-slate-800">
          <View className="flex-row items-center">
            <Pressable onPress={handleBack} className="p-1 mr-3">
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "#E2E8F0" : "#1B2B4B"}
              />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-[#1B2B4B] dark:text-slate-100">Assessment Result</Text>
              <Text className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">AI Clinical Screening Breakdown</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-5 gap-4">
            {/* Captured Lesion Image */}
            {displayImage ? (
              <View
                className="w-full rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-900 shadow-sm"
                style={{ height: 210 }}
              >
                <Image
                  source={{ uri: displayImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            ) : null}

            {/* Top Diagnosis Card */}
            <Card>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
                  Primary Classification
                </Text>
                {diagnosisInfo.malignant ? (
                  <View className="bg-[#DC2626] px-2.5 py-0.5 rounded-full">
                    <Text className="text-white text-[11px] font-bold">Malignant</Text>
                  </View>
                ) : (
                  <View className="bg-[#0D9E94] px-2.5 py-0.5 rounded-full">
                    <Text className="text-white text-[11px] font-bold">Benign</Text>
                  </View>
                )}
              </View>
              <Text className="text-[20px] font-extrabold text-[#1B2B4B] dark:text-slate-100 tracking-tight">
                {diagnosisInfo.name}
              </Text>
              <View className="mt-3 pt-3 border-t border-[#F1F5F9] dark:border-slate-800">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                    Model Confidence
                  </Text>
                  <Text className="text-sm font-bold text-[#0D9E94] dark:text-teal-400">
                    {Math.round(safeResult.confidenceScore * 100)}%
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
                  <View
                    className="h-full rounded-full bg-[#0D9E94] dark:bg-[#2DD4BF]"
                    style={{ width: `${Math.max(Math.round(safeResult.confidenceScore * 100), 5)}%` }}
                  />
                </View>
              </View>
            </Card>

            {/* Solid Risk Tier Hero Badge */}
            <RiskTierBadge riskTier={safeResult.riskTier} showAction />

            {/* Class Probability Breakdown */}
            <Card>
              <ClassProbabilityList
                classProbabilities={safeResult.classProbabilities}
                predictedClass={safeResult.predictedClass}
              />
            </Card>

            {/* ABCD Explainability Panel */}
            <Card>
              <ABCDPanel scores={safeResult.abcdScores} />
            </Card>

            {/* Clinical Disclaimer Note */}
            <View className="px-2 pt-1 pb-2 items-center">
              <Text className="text-[11px] text-[#64748B] dark:text-slate-400 text-center leading-relaxed font-medium">
                DermSight is an AI-assisted screening tool. All findings must be validated by a clinical specialist.
              </Text>
            </View>
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
                disabled={saving}
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
    </SafeAreaView>
  );
}
