/**
 * Assessment History screen — timeline of past assessments for a patient.
 */

import { Badge } from "@/components/ui/Badge";
import { DIAGNOSIS_LABELS } from "@/constants/riskLevels";
import { getAssessmentsByPatient } from "@/features/assessments/repository";
import type { Assessment } from "@/types";
import { formatDateTime } from "@/utils/date";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

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
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (patientId) {
      getAssessmentsByPatient(patientId).then(setAssessments);
    }
  }, [patientId]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 mr-3">
            <Text className="text-xl">←</Text>
          </Pressable>
          <View>
            <Text className="text-lg font-bold text-navy">
              Assessment History
            </Text>
            <Text className="text-xs text-gray-500">
              {assessments.length} total assessments
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={assessments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: `/(app)/patients/${patientId}/result`,
                params: {
                  assessmentId: item.id,
                  imageUri: item.imageLocalUri,
                  patientId,
                },
              } as Href)
            }
            className="bg-white mx-5 mt-3 p-4 rounded-2xl border border-gray-100"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-gray-500">
                {formatDateTime(item.capturedAt)}
              </Text>
              <Badge riskTier={item.riskTier} size="sm" />
            </View>
            <Text className="text-base font-semibold text-navy">
              {DIAGNOSIS_LABELS[item.predictedClass]?.name}
            </Text>
            <Text className="text-xs text-gray-400 mt-1">
              Confidence: {Math.round(item.confidenceScore * 100)}% • Model v
              {item.modelVersion}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400">No assessments yet.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
