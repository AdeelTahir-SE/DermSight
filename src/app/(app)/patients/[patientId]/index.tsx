import { Badge } from "@/components/ui/Badge";
import { getAssessmentsByPatient } from "@/features/assessments/repository";
import { getPatientById } from "@/features/patients/repository";
import { usePatientsStore } from "@/features/patients/store";
import { useThemeStore } from "@/features/theme/store";
import type { Assessment, Patient } from "@/types";
import { calculateAge, formatDate, formatDateTime } from "@/utils/date";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const ICON_SIZE = 20;
const ICON_COLOR = "#64748B";
const ICON_COLOR_DARK = "#94A3B8";

export default function PatientDetailScreen() {
  const { patientId: rawPatientId, patientid: fallbackPatientId } =
    useLocalSearchParams<{
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

  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const patient = patients.find((p) => p.id === patientId) || dbPatient;

  if (!patient) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-gray-500 dark:text-slate-400">Loading...</Text>
      </View>
    );
  }

  const initials =
    `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const age = calculateAge(patient.dateOfBirth);
  const displayId = patient.id.substring(0, 8).toUpperCase();

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
      <View className="bg-white dark:bg-slate-900 px-5 pt-12 pb-4 flex-row items-center justify-between">
        <Pressable onPress={handleBack} className="p-1">
          <Image
            source={require("../../../../assets/icons/profile-back.png")}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
            tintColor={isDark ? "#E2E8F0" : "#1B2B4B"}
          />
        </Pressable>
        <Pressable onPress={handleEdit} className="flex-row items-center">
          <Image
            source={require("../../../../assets/icons/profile-edit.png")}
            style={{ width: 16, height: 16, marginRight: 4 }}
            contentFit="contain"
            tintColor="#0D9E94"
          />
          <Text className="text-sm font-semibold text-primary dark:text-primary-400">
            Edit
          </Text>
        </Pressable>
      </View>

      {/* Profile Card */}
      <View className="bg-white dark:bg-slate-900 px-5 pb-5">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/20 items-center justify-center mr-4">
            <Text className="text-primary dark:text-primary-400 font-bold text-xl">
              {initials}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-xl font-bold text-navy dark:text-slate-100 mr-2">
                {patient.firstName} {patient.lastName}
              </Text>
              <View className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/20">
                <Text className="text-xs font-semibold text-primary dark:text-primary-400">
                  Active
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {displayId} •{" "}
              {patient.sex === "male"
                ? "Male"
                : patient.sex === "female"
                  ? "Female"
                  : "Other"}
              , {age} yrs
            </Text>
            <Text className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Registered on: {formatDate(patient.createdAt)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-around mt-5 bg-gray-50 dark:bg-slate-850 rounded-2xl py-4">
          <QuickAction
            icon={require("../../../../assets/icons/profile-phone.png")}
            label="Call"
            onPress={() =>
              patient.phone && Linking.openURL(`tel:${patient.phone}`)
            }
          />
          <QuickAction
            icon={require("../../../../assets/icons/profile-message.png")}
            label="Message"
            onPress={() =>
              patient.phone && Linking.openURL(`sms:${patient.phone}`)
            }
          />
          <QuickAction
            icon={require("../../../../assets/icons/profile-location.png")}
            label="View Location"
            onPress={() => {
              if (patient.latitude && patient.longitude) {
                const url = `https://maps.google.com/?q=${patient.latitude},${patient.longitude}`;
                Linking.openURL(url);
              } else {
                Alert.alert(
                  "Location",
                  "No location data available for this patient.",
                );
              }
            }}
          />
        </View>
      </View>

      <View className="px-5 pb-8">
        {/* Patient Information */}
        <SectionHeader title="Patient Information" />
        <Card>
          <InfoRow
            icon={require("../../../../assets/icons/profile-dob.png")}
            label="Date of Birth"
            value={formatDate(patient.dateOfBirth)}
          />
          <InfoRow
            icon={require("../../../../assets/icons/profile-gender.png")}
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
            icon={require("../../../../assets/icons/profile-id.png")}
            label="Patient ID"
            value={displayId}
          />
          <InfoRow
            icon={require("../../../../assets/icons/profile-location.png")}
            label="Address"
            value={patient.address || "Not provided"}
          />
          <InfoRow
            icon={require("../../../../assets/icons/profile-phone.png")}
            label="Phone Number"
            value={patient.phone || "Not provided"}
            isLast
          />
        </Card>

        {/* Assessment Summary */}
        <SectionHeader title="Assessment Summary" />
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80">
          <View className="flex-row gap-2 mb-4">
            <SummaryCard
              count={assessments.length}
              label="Assessments"
              sublabel="Total"
              bgClass="bg-primary-50 dark:bg-primary-950/20"
              textClass="text-primary dark:text-primary-400"
            />
            <SummaryCard
              count={highRiskCount}
              label="High Risk"
              sublabel="Findings"
              bgClass="bg-amber-50 dark:bg-amber-950/20"
              textClass="text-amber-600 dark:text-amber-400"
            />
            <SummaryCard
              count={lowRiskCount}
              label="Low Risk"
              sublabel="Findings"
              bgClass="bg-blue-50 dark:bg-blue-950/20"
              textClass="text-blue-600 dark:text-blue-400"
            />
          </View>
          <Pressable
            onPress={handleNewAssessment}
            className="bg-primary dark:bg-primary-600 rounded-xl py-3.5 items-center flex-row justify-center"
          >
            <Text className="text-white font-semibold">
              New Skin Assessment
            </Text>
          </Pressable>
        </View>

        {/* Recent Assessments */}
        {assessments.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-2">
              <Text className="text-sm font-semibold text-primary dark:text-primary-400">
                Recent Assessments
              </Text>
              <Pressable
                onPress={async () => {
                  try {
                    await Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light,
                    );
                  } catch (e) {}
                  router.push(`/(app)/patients/${patientId}/history`);
                }}
              >
                <Text className="text-sm text-primary dark:text-primary-400 font-semibold">
                  View All
                </Text>
              </Pressable>
            </View>
            <Card>
              {assessments.slice(0, 3).map((assessment, index) => (
                <Pressable
                  key={assessment.id}
                  onPress={() => handleAssessmentClick(assessment)}
                  className={`flex-row items-center p-4 ${
                    index === assessments.slice(0, 3).length - 1
                      ? ""
                      : "border-b border-gray-100 dark:border-slate-800/80"
                  }`}
                >
                  <View className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-850 overflow-hidden mr-3">
                    {assessment.imageLocalUri ? (
                      <Image
                        source={{ uri: assessment.imageLocalUri }}
                        style={{ width: 48, height: 48 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-lg">🔬</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-400 dark:text-slate-500">
                      {formatDateTime(assessment.capturedAt)}
                    </Text>
                    <Text className="text-sm font-semibold text-navy dark:text-slate-200 mt-0.5">
                      {assessment.bodyLocation || "Unknown location"}
                    </Text>
                  </View>
                  <Badge riskTier={assessment.riskTier} size="sm" />
                  <Text className="text-gray-300 dark:text-slate-600 ml-2 text-lg">
                    ›
                  </Text>
                </Pressable>
              ))}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-sm font-semibold text-primary dark:text-primary-400 mt-6 mb-2">
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800/80">
      {children}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
}) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    if (onPress) onPress();
  };

  return (
    <Pressable onPress={handlePress} className="items-center flex-1">
      <Image
        source={icon}
        style={{ width: 24, height: 24, marginBottom: 6 }}
        contentFit="contain"
        tintColor="#0D9E94"
      />
      <Text className="text-xs text-gray-600 dark:text-slate-400 font-medium">
        {label}
      </Text>
    </Pressable>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: any;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center py-3.5 px-4 ${isLast ? "" : "border-b border-gray-100 dark:border-slate-800/80"}`}
    >
      <Image
        source={icon}
        style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 12 }}
        contentFit="contain"
        tintColor={ICON_COLOR}
      />
      <Text className="text-sm text-gray-500 dark:text-slate-400 flex-1">
        {label}
      </Text>
      <Text className="text-sm font-semibold text-navy dark:text-slate-200 text-right">
        {value}
      </Text>
    </View>
  );
}

function SummaryCard({
  count,
  label,
  sublabel,
  bgClass,
  textClass,
}: {
  count: number;
  label: string;
  sublabel: string;
  bgClass: string;
  textClass: string;
}) {
  return (
    <View className={`flex-1 rounded-xl p-3 ${bgClass}`}>
      <Text className={`text-2xl font-bold ${textClass}`}>{count}</Text>
      <Text className={`text-xs font-medium mt-0.5 ${textClass}`}>{label}</Text>
      <Text className={`text-xs ${textClass} opacity-70`}>{sublabel}</Text>
    </View>
  );
}
