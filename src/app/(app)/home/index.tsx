import { useAssessmentsStore } from "@/features/assessments/store";
import { useAuthStore } from "@/features/auth/store";
import { usePatientsStore } from "@/features/patients/store";
import { useThemeStore } from "@/features/theme/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { workerName } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";
  const { patients, loadPatients } = usePatientsStore();
  const { totalCount, pendingSyncCount, highRiskCount, loadCounts } = useAssessmentsStore();
  const { isOffline } = useConnectivity();

  useEffect(() => {
    loadPatients();
    loadCounts();
  }, []);

  const handleStartAssessment = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.push("/patients");
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView
        className="flex-1 bg-white dark:bg-slate-950"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 24,
        }}
      >
      {/* Header */}
      <View className="px-5 pt-3 pb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-[26px] font-bold text-[#1B2B4B] dark:text-slate-100 tracking-tight">
              {t("home:greeting", { name: workerName || "Aisha" })}
            </Text>
            <Text className="text-[14px] text-[#64748B] dark:text-slate-400 mt-0.5">
              {t("home:role", { defaultValue: "Community Health Worker" })}
            </Text>
            <View className="flex-row items-center mt-1.5">
              <View
                className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-[#10B981]"} mr-1.5`}
              />
              <Text className="text-[13px] text-[#64748B] dark:text-slate-400 font-medium">
                {isOffline
                  ? t("home:deviceOffline", { defaultValue: "Device Offline" })
                  : t("home:deviceOnline", { defaultValue: "Device Online" })}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View className="px-5">
        {/* New Skin Assessment Hero Action Button */}
        <Pressable
          onPress={handleStartAssessment}
          className="bg-[#0D9E94] dark:bg-[#0A7E76] rounded-[22px] p-4.5 mb-5 flex-row items-center justify-between shadow-sm active:opacity-95"
          style={{ paddingVertical: 18, paddingHorizontal: 16 }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-14 h-14 rounded-2xl bg-white items-center justify-center mr-3.5 shadow-sm">
              <Ionicons name="camera-outline" size={28} color="#0D9E94" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[17px] font-bold tracking-tight">
                {t("home:newAssessment", { defaultValue: "New Skin Assessment" })}
              </Text>
              <Text className="text-white/85 text-[13px] mt-0.5">
                {t("home:newAssessmentSub", { defaultValue: "Capture or upload a lesion" })}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="rgba(255, 255, 255, 0.85)"
          />
        </Pressable>

        {/* Metric Cards - 2x2 Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-3.5 mb-5">
          <MetricCard
            icon="people-outline"
            title={t("home:patients", { defaultValue: "Patients" })}
            subtitle={t("home:records", {
              count: patients.length,
              defaultValue: `${patients.length} Records`,
            })}
            onPress={() => router.push("/patients")}
            isDark={isDark}
          />
          <MetricCard
            icon="alert-circle-outline"
            title={t("home:highRiskAlerts", { defaultValue: "High Risk Alerts" })}
            subtitle={t("home:highRiskCases", {
              count: highRiskCount,
              defaultValue: `${highRiskCount} Urgent Cases`,
            })}
            onPress={() => router.push("/(app)/reports" as any)}
            isDark={isDark}
            iconColor={highRiskCount > 0 ? "#EF4444" : "#0D9E94"}
          />
          <MetricCard
            icon="cloud-upload-outline"
            title={t("home:pendingSync", { defaultValue: "Pending Sync" })}
            subtitle={t("home:records", {
              count: pendingSyncCount,
              defaultValue: `${pendingSyncCount} Records`,
            })}
            onPress={() => router.push("/assessments")}
            isDark={isDark}
          />
          <MetricCard
            icon="bar-chart-outline"
            title={t("home:reports", { defaultValue: "Reports" })}
            subtitle={t("home:viewSummary", { defaultValue: "View Summary" })}
            onPress={() => router.push("/(app)/reports" as any)}
            isDark={isDark}
          />
        </View>

        {/* Offline Status Banner Card - Only rendered when offline without right arrow */}
        {isOffline && (
          <Pressable
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
            }}
            className="flex-row items-center bg-[#E8F7F5] dark:bg-teal-950/30 border border-[#D0F0EB] dark:border-teal-900/40 rounded-2xl p-4 active:opacity-90"
          >
            <View className="w-12 h-12 rounded-full bg-[#CCEFEB] dark:bg-teal-900/50 items-center justify-center mr-3.5">
              <Image
                source={require("../../../../assets/icons/home-wifi-off.png")}
                style={{ width: 22, height: 22 }}
                contentFit="contain"
                tintColor="#0D9E94"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-[#1B2B4B] dark:text-slate-100">
                {t("home:offlineBanner", { defaultValue: "You are offline" })}
              </Text>
              <Text className="text-[12px] text-[#64748B] dark:text-slate-400 mt-0.5 leading-[17px]">
                {t("home:offlineBannerDesc", {
                  defaultValue: "Data will sync automatically when connection is available.",
                })}
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  title,
  subtitle,
  onPress,
  isDark,
  iconColor = "#0D9E94",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  isDark: boolean;
  iconColor?: string;
}) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-row items-center active:opacity-85"
      style={{ width: "48%" }}
    >
      <Ionicons name={icon} size={28} color={iconColor} style={{ marginRight: 10 }} />
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-[15px] font-bold text-[#1B2B4B] dark:text-slate-100"
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          className="text-[13px] text-[#64748B] dark:text-slate-400 mt-0.5 font-normal"
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
