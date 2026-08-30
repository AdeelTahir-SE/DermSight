import { PatientHeader } from "@/components/patient/PatientHeader";
import { Badge } from "@/components/ui/Badge";
import { getAssessmentsByPatient } from "@/features/assessments/repository";
import { getPatientById } from "@/features/patients/repository";
import type { Assessment, Patient } from "@/types";
import { usePatientsStore } from "@/features/patients/store";
import { formatDate, formatDateTime } from "@/utils/date";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export default function PatientDetailScreen() {
  const {
    patientId: rawPatientId,
    patientid: fallbackPatientId,
  } = useLocalSearchParams<{
    patientId?: string;
    patientid?: string;
  }>();
  const patientId = rawPatientId || fallbackPatientId || "";
  const router = useRouter();
  const { patients } = usePatientsStore();
  const [dbPatient, setDbPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(setDbPatient);
      getAssessmentsByPatient(patientId).then(setAssessments);
    }
  }, [patientId]);

  const patient = patients.find((p) => p.id === patientId) || dbPatient;

  if (!patient) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-gray-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  const highRiskCount = assessments.filter(
    (a) => a.riskTier === "high" || a.riskTier === "urgent_referral",
  ).length;
  const lowRiskCount = assessments.length - highRiskCount;

  const handleBack = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.back();
  };

  const handleEdit = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.push(`/(app)/patients/${patientId}/edit` as Href);
  };

  const handleNewAssessment = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.push(`/(app)/patients/${patientId}/capture`);
  };

  const handleAssessmentClick = async (assessment: Assessment) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.push({
      pathname: `/(app)/patients/${patientId}/result`,
      params: {
        assessmentId: assessment.id,
        imageUri: assessment.imageLocalUri,
        patientId,
      },
    } as Href);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-4 pb-0 border-b border-gray-100 dark:border-slate-800/80">
        <Pressable
          onPress={handleBack}
          className="mb-3 p-1 self-start"
        >
          <Text className="text-xl text-navy dark:text-slate-100">←</Text>
        </Pressable>
      </View>
      <PatientHeader patient={patient} />

      {/* Patient Information */}
      <View className="bg-white dark:bg-slate-900 mt-3 p-5 border-y border-gray-150/10 dark:border-slate-800/80">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base font-semibold text-navy dark:text-slate-100">
            Patient Information
          </Text>
          <Pressable
            onPress={handleEdit}
            className="p-1"
          >
            <Text className="text-sm font-semibold text-primary dark:text-primary-400">✏️ Edit</Text>
          </Pressable>
        </View>
        <InfoRow
          label="Date of Birth"
          value={formatDate(patient.dateOfBirth)}
        />
        <InfoRow
          label="Gender"
          value={
            patient.sex === "male"
              ? "Male"
              : patient.sex === "female"
                ? "Female"
                : "Other"
          }
        />
        <InfoRow
          label="Patient ID"
          value={patient.id.substring(0, 8).toUpperCase()}
        />
        {patient.address && <InfoRow label="Address" value={patient.address} />}
        {patient.phone && <InfoRow label="Phone" value={patient.phone} />}
      </View>

      {/* Assessment Summary */}
      <View className="bg-white dark:bg-slate-900 mt-3 p-5 border-y border-gray-150/10 dark:border-slate-800/80">
        <Text className="text-base font-semibold text-navy dark:text-slate-100 mb-3">
          Assessment Summary
        </Text>
        <View className="gap-2 mb-4">
          <SummaryCard
            count={assessments.length}
            label="Assessments Total"
            bgColorClass="bg-primary-50 dark:bg-primary-950/20"
            textColorClass="text-primary dark:text-primary-450"
          />
          {highRiskCount > 0 && (
            <SummaryCard
              count={highRiskCount}
              label="High Risk Findings"
              bgColorClass="bg-orange-50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/20"
              textColorClass="text-orange-650 dark:text-orange-400"
            />
          )}
          {lowRiskCount > 0 && (
            <SummaryCard
              count={lowRiskCount}
              label="Low Risk Findings"
              bgColorClass="bg-blue-50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/20"
              textColorClass="text-blue-600 dark:text-blue-400"
            />
          )}
        </View>

        {/* New Assessment Button */}
        <Pressable
          onPress={handleNewAssessment}
          className="bg-primary dark:bg-primary-600 rounded-xl py-3.5 items-center flex-row justify-center"
        >
          <Text className="text-lg mr-2">📷</Text>
          <Text className="text-white font-semibold">New Skin Assessment</Text>
        </Pressable>
      </View>

      {/* Recent Assessments */}
      {assessments.length > 0 && (
        <View className="bg-white dark:bg-slate-900 mt-3 p-5 border-y border-gray-150/10 dark:border-slate-800/80">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-navy dark:text-slate-100">
              Recent Assessments
            </Text>
            <Pressable
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
                router.push(`/(app)/patients/${patientId}/history`);
              }}
            >
              <Text className="text-sm text-primary dark:text-primary-400 font-semibold">View All</Text>
            </Pressable>
          </View>
          {assessments.slice(0, 3).map((assessment) => (
            <Pressable
              key={assessment.id}
              onPress={() => handleAssessmentClick(assessment)}
              className="flex-row items-center py-3.5 border-b border-gray-50 dark:border-slate-800/50"
            >
              <View className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-850 items-center justify-center mr-3">
                <Text className="text-lg">🔬</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-navy dark:text-slate-200">
                  {formatDateTime(assessment.capturedAt)}
                </Text>
                {assessment.bodyLocation && (
                  <Text className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {assessment.bodyLocation}
                  </Text>
                )}
              </View>
              <Badge riskTier={assessment.riskTier} size="sm" />
              <Text className="text-gray-300 dark:text-slate-700 ml-2">›</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View className="h-24" />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-3 border-b border-gray-50 dark:border-slate-850/50">
      <Text className="text-sm text-gray-500 dark:text-slate-400">{label}</Text>
      <Text className="text-sm font-semibold text-navy dark:text-slate-200 flex-1 text-right ml-4">
        {value}
      </Text>
    </View>
  );
}

function SummaryCard({
  count,
  label,
  bgColorClass,
  textColorClass,
}: {
  count: number;
  label: string;
  bgColorClass: string;
  textColorClass: string;
}) {
  return (
    <View className={`flex-row items-center rounded-xl p-3 ${bgColorClass}`}>
      <Text className={`text-2xl font-bold mr-2 ${textColorClass}`}>
        {count}
      </Text>
      <Text className={`text-sm font-medium ${textColorClass}`}>
        {label}
      </Text>
    </View>
  );
}
