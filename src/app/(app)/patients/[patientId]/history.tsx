import { Badge } from "@/components/ui/Badge";
import { AssessmentListSkeleton } from "@/components/assessment/AssessmentListSkeleton";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import { getAssessmentsByPatient } from "@/features/assessments/repository";
import { useThemeStore } from "@/features/theme/store";
import type { Assessment } from "@/types";
import { formatDateTime } from "@/utils/date";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export default function HistoryScreen() {
  const {
    patientId: rawPatientId,
    patientid: fallbackPatientId,
  } = useLocalSearchParams<{
    patientId?: string;
    patientid?: string;
  }>();
  const patientId = rawPatientId || fallbackPatientId || "";
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (patientId) {
        try {
          const list = await getAssessmentsByPatient(patientId);
          setAssessments(list);
        } catch (e) {
          console.error("Failed to load assessments:", e);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [patientId]);

  const handleBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.back();
  };

  const handleAssessmentClick = async (item: Assessment) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.push({
      pathname: `/(app)/patients/${patientId}/result`,
      params: {
        assessmentId: item.id,
        imageUri: item.imageLocalUri,
        patientId,
      },
    } as Href);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800/80">
        <View className="flex-row items-center">
          <Pressable onPress={handleBack} className="p-1 mr-3">
            <Image
              source={require("../../../../../assets/icons/profile-back.png")}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
              tintColor={isDark ? "#E2E8F0" : "#1B2B4B"}
            />
          </Pressable>
          <View>
            <Text className="text-lg font-bold text-navy dark:text-slate-100">
              Assessment History
            </Text>
            <Text className="text-xs text-gray-500 dark:text-slate-400">
              {assessments.length} total assessments
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <AssessmentListSkeleton count={4} />
      ) : (
        <FlatList
          data={assessments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleAssessmentClick(item)}
              className="bg-white dark:bg-slate-900 mx-5 mt-3 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/80"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-500 dark:text-slate-400">
                  {formatDateTime(item.capturedAt)}
                </Text>
                <Badge riskTier={item.riskTier} size="sm" />
              </View>
              <Text className="text-base font-semibold text-navy dark:text-slate-100">
                {DIAGNOSIS_LABELS[item.predictedClass]?.name}
              </Text>
              <Text className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                Confidence: {Math.round(item.confidenceScore * 100)}% • Model v
                {item.modelVersion}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400 dark:text-slate-500">No assessments yet.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
