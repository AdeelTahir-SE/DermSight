/**
 * Patient Profile Detail screen — demographics, past assessments, sync status.
 */

import { PatientHeader } from "@/components/patient/PatientHeader";
import { Badge } from "@/components/ui/Badge";
import { getAssessmentsByPatient } from "@/features/assessments/repository";
import { getPatientById } from "@/features/patients/repository";
import type { Assessment, Patient } from "@/types";
import { formatDate, formatDateTime } from "@/utils/date";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function PatientDetailScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(setPatient);
      getAssessmentsByPatient(patientId).then(setAssessments);
    }
  }, [patientId]);

  if (!patient) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  const highRiskCount = assessments.filter(
    (a) => a.riskTier === "high" || a.riskTier === "urgent_referral",
  ).length;
  const lowRiskCount = assessments.length - highRiskCount;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-0 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="mb-3 p-1 self-start"
        >
          <Text className="text-xl">←</Text>
        </Pressable>
      </View>
      <PatientHeader patient={patient} />

      {/* Patient Information */}
      <View className="bg-white mt-3 p-5">
        <Text className="text-base font-semibold text-navy mb-3">
          Patient Information
        </Text>
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
      <View className="bg-white mt-3 p-5">
        <Text className="text-base font-semibold text-navy mb-3">
          Assessment Summary
        </Text>
        <View className="gap-2 mb-4">
          <SummaryCard
            count={assessments.length}
            label="Assessments Total"
            color="#E6F7F5"
            textColor="#0D9E94"
          />
          {highRiskCount > 0 && (
            <SummaryCard
              count={highRiskCount}
              label="High Risk Findings"
              color="#FFEDD5"
              textColor="#EA580C"
            />
          )}
          {lowRiskCount > 0 && (
            <SummaryCard
              count={lowRiskCount}
              label="Low Risk Findings"
              color="#DBEAFE"
              textColor="#2563EB"
            />
          )}
        </View>

        {/* New Assessment Button */}
        <Pressable
          onPress={() => router.push(`/(app)/patients/${patientId}/capture`)}
          className="bg-primary rounded-xl py-3.5 items-center flex-row justify-center"
        >
          <Text className="text-lg mr-2">📷</Text>
          <Text className="text-white font-semibold">New Skin Assessment</Text>
        </Pressable>
      </View>

      {/* Recent Assessments */}
      {assessments.length > 0 && (
        <View className="bg-white mt-3 p-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-navy">
              Recent Assessments
            </Text>
            <Pressable
              onPress={() =>
                router.push(`/(app)/patients/${patientId}/history`)
              }
            >
              <Text className="text-sm text-primary">View All</Text>
            </Pressable>
          </View>
          {assessments.slice(0, 3).map((assessment) => (
            <Pressable
              key={assessment.id}
              onPress={() => {
                router.push({
                  pathname: `/(app)/patients/${patientId}/result`,
                  params: {
                    assessmentId: assessment.id,
                    imageUri: assessment.imageLocalUri,
                    patientId,
                  },
                } as Href);
              }}
              className="flex-row items-center py-3 border-b border-gray-50"
            >
              <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3">
                <Text className="text-lg">🔬</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-navy">
                  {formatDateTime(assessment.capturedAt)}
                </Text>
                {assessment.bodyLocation && (
                  <Text className="text-xs text-gray-400">
                    {assessment.bodyLocation}
                  </Text>
                )}
              </View>
              <Badge riskTier={assessment.riskTier} size="sm" />
              <Text className="text-gray-300 ml-2">›</Text>
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
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-navy flex-1 text-right ml-4">
        {value}
      </Text>
    </View>
  );
}

function SummaryCard({
  count,
  label,
  color,
  textColor,
}: {
  count: number;
  label: string;
  color: string;
  textColor: string;
}) {
  return (
    <View
      className="flex-row items-center rounded-xl p-3"
      style={{ backgroundColor: color }}
    >
      <Text className="text-2xl font-bold mr-2" style={{ color: textColor }}>
        {count}
      </Text>
      <Text className="text-sm" style={{ color: textColor }}>
        {label}
      </Text>
    </View>
  );
}
