import { getAllAssessments } from "@/features/assessments/repository";
import { toast } from "@/features/notifications/toastStore";
import { getAllPatients } from "@/features/patients/repository";
import { useThemeStore } from "@/features/theme/store";
import type { Assessment, Patient } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PeriodFilter = "week" | "month" | "all";

const CLASS_CONFIGS: Record<
  string,
  { label: string; color: string; full: string; icon: keyof typeof Ionicons.glyphMap; bg: string }
> = {
  nv: { label: "NV", color: "#3B82F6", full: "Melanocytic Nevi", icon: "disc-outline", bg: "#EFF6FF" },
  mel: { label: "MEL", color: "#EF4444", full: "Melanoma", icon: "warning", bg: "#FEF2F2" },
  bkl: { label: "BKL", color: "#10B981", full: "Benign Keratosis", icon: "shield-checkmark", bg: "#ECFDF5" },
  bcc: { label: "BCC", color: "#F97316", full: "Basal Cell Carcinoma", icon: "alert-circle", bg: "#FFF7ED" },
  akiec: { label: "AKIEC", color: "#EC4899", full: "Actinic Keratoses", icon: "flame", bg: "#FDF2F8" },
  vasc: { label: "VASC", color: "#8B5CF6", full: "Vascular Lesions", icon: "water", bg: "#F5F3FF" },
  df: { label: "DF", color: "#64748B", full: "Dermatofibroma", icon: "bandage", bg: "#F8FAFC" },
};

export default function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, a] = await Promise.all([getAllPatients(), getAllAssessments()]);
        setPatients(p);
        setAssessments(a);
      } catch (e) {
        console.error("Failed to load reports data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter assessments and patients based on period
  const filteredData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const filteredAssessments = assessments.filter((item) => {
      if (period === "all") return true;
      const date = new Date(item.capturedAt || item.createdAt);
      if (period === "week") return date >= startOfWeek;
      if (period === "month") return date >= startOfMonth;
      return true;
    });

    const filteredPatients = patients.filter((item) => {
      if (period === "all") return true;
      const date = new Date(item.createdAt || item.capturedAt);
      if (period === "week") return date >= startOfWeek;
      if (period === "month") return date >= startOfMonth;
      return true;
    });

    return {
      patients: filteredPatients,
      assessments: filteredAssessments,
    };
  }, [patients, assessments, period]);

  // Aggregated analytics
  const metrics = useMemo(() => {
    const totalAssessments = filteredData.assessments.length;
    const totalPatients = filteredData.patients.length;

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let syncedCount = 0;

    const classCounts: Record<string, number> = {
      nv: 0,
      mel: 0,
      bkl: 0,
      bcc: 0,
      akiec: 0,
      vasc: 0,
      df: 0,
    };

    for (const a of filteredData.assessments) {
      if (a.riskTier === "high") highRiskCount++;
      else if (a.riskTier === "medium") mediumRiskCount++;
      else lowRiskCount++;

      if (a.syncStatus === "synced") syncedCount++;

      const cls = a.predictedClass?.toLowerCase();
      if (cls && classCounts[cls] !== undefined) {
        classCounts[cls]++;
      }
    }

    const syncPercentage =
      totalAssessments > 0 ? Math.round((syncedCount / totalAssessments) * 100) : 100;

    return {
      totalAssessments,
      totalPatients,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      syncPercentage,
      classCounts,
    };
  }, [filteredData]);

  const handlePeriodChange = async (p: PeriodFilter) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setPeriod(p);
  };

  const handleExport = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setExporting(true);

      const reportData = {
        title: "DermSight Clinical Epidemiology Report",
        generatedAt: new Date().toISOString(),
        periodSelected: period,
        summary: {
          patientsScreened: metrics.totalPatients,
          totalAssessments: metrics.totalAssessments,
          highRiskCases: metrics.highRiskCount,
          mediumRiskCases: metrics.mediumRiskCount,
          lowRiskCases: metrics.lowRiskCount,
          syncRatePercentage: metrics.syncPercentage,
        },
        diagnosticClassBreakdown: metrics.classCounts,
        patientListSample: filteredData.patients.slice(0, 10).map((p) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          sex: p.sex,
          dob: p.dateOfBirth,
          address: p.address,
        })),
      };

      const fileUri = `${FileSystem.cacheDirectory}dermsight_report_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(reportData, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: t("reports:export", { defaultValue: "Export Report" }),
          UTI: "public.json",
        });
        toast.success(t("reports:exportSuccess", { defaultValue: "Report exported successfully!" }));
      }
    } catch (e) {
      console.error(e);
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" color="#0D9E94" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
        {/* Header */}
        <View className="bg-white dark:bg-slate-900 px-5 pt-3 pb-4 border-b border-[#EBF2F1] dark:border-slate-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.back()}
                className="mr-3.5 p-1"
              >
                <Image
                  source={require("../../../../assets/icons/profile-back.png")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                  tintColor={isDark ? "#E2E8F0" : "#1B2B4B"}
                />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-xl font-bold text-[#1B2B4B] dark:text-slate-100" numberOfLines={1}>
                  {t("reports:title", { defaultValue: "Clinical Reports" })}
                </Text>
                <Text className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5" numberOfLines={1}>
                  {t("reports:subtitle", { defaultValue: "Screening summary & epidemiology data" })}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExport}
              disabled={exporting}
              className="bg-[#0D9E94] px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 shadow-sm"
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                  <Text className="text-[12px] font-bold text-white">
                    {t("reports:export", { defaultValue: "Export" })}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        >
          {/* Period Filter Tabs */}
          <View className="flex-row items-center gap-2 mb-5">
            <PeriodTabButton
              icon="calendar-outline"
              label={t("reports:periodAll", { defaultValue: "All Time" })}
              isActive={period === "all"}
              onPress={() => handlePeriodChange("all")}
            />
            <PeriodTabButton
              icon="time-outline"
              label={t("reports:periodMonth", { defaultValue: "This Month" })}
              isActive={period === "month"}
              onPress={() => handlePeriodChange("month")}
            />
            <PeriodTabButton
              icon="today-outline"
              label={t("reports:periodWeek", { defaultValue: "This Week" })}
              isActive={period === "week"}
              onPress={() => handlePeriodChange("week")}
            />
          </View>

          {/* 2x2 Metric KPI Cards */}
          <View className="flex-row flex-wrap justify-between gap-y-3 mb-5">
            <KPICard
              icon="people"
              title={t("reports:patientsScreened", { defaultValue: "Patients Screened" })}
              value={metrics.totalPatients.toString()}
              color="#0D9E94"
              bg={isDark ? "#042F2E" : "#E6F7F5"}
            />
            <KPICard
              icon="medical"
              title={t("reports:totalAssessments", { defaultValue: "Total Assessments" })}
              value={metrics.totalAssessments.toString()}
              color="#3B82F6"
              bg={isDark ? "#172554" : "#EFF6FF"}
            />
            <KPICard
              icon="alert-circle"
              title={t("reports:highRiskCases", { defaultValue: "High Risk Cases" })}
              value={metrics.highRiskCount.toString()}
              color="#EF4444"
              bg={isDark ? "#450A0A" : "#FEF2F2"}
            />
            <KPICard
              icon="cloud-done"
              title={t("reports:syncRate", { defaultValue: "Sync Coverage" })}
              value={`${metrics.syncPercentage}%`}
              color="#10B981"
              bg={isDark ? "#064E3B" : "#ECFDF5"}
            />
          </View>

          {/* Triage Risk Breakdown Card */}
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 mb-5 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[16px] font-bold text-[#1B2B4B] dark:text-slate-100">
                  {t("reports:triageBreakdown", { defaultValue: "Triage Risk Breakdown" })}
                </Text>
                <Text className="text-[12px] text-[#64748B] dark:text-slate-400 mt-0.5">
                  {t("reports:triageBreakdownDesc", {
                    defaultValue: "Distribution of patient risk classifications",
                  })}
                </Text>
              </View>
              <Ionicons name="pie-chart-outline" size={20} color="#0D9E94" />
            </View>

            <View className="gap-3.5">
              <RiskProgressRow
                icon="alert-circle"
                label={t("reports:highRisk", { defaultValue: "High Risk" })}
                count={metrics.highRiskCount}
                total={metrics.totalAssessments}
                color="#EF4444"
                badgeBg="#FEE2E2"
                badgeText="#DC2626"
              />
              <RiskProgressRow
                icon="warning"
                label={t("reports:mediumRisk", { defaultValue: "Medium Risk" })}
                count={metrics.mediumRiskCount}
                total={metrics.totalAssessments}
                color="#F59E0B"
                badgeBg="#FEF3C7"
                badgeText="#D97706"
              />
              <RiskProgressRow
                icon="checkmark-circle"
                label={t("reports:lowRisk", { defaultValue: "Low Risk" })}
                count={metrics.lowRiskCount}
                total={metrics.totalAssessments}
                color="#10B981"
                badgeBg="#DCFCE7"
                badgeText="#16A34A"
              />
            </View>
          </View>

          {/* Diagnostic Class Distribution Card */}
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 mb-5 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-[16px] font-bold text-[#1B2B4B] dark:text-slate-100">
                  {t("reports:diagnosticDistribution", { defaultValue: "Diagnostic Class Distribution" })}
                </Text>
                <Text className="text-[12px] text-[#64748B] dark:text-slate-400 mt-0.5">
                  {t("reports:diagnosticDistributionDesc", {
                    defaultValue: "Prevalence of AI-identified lesion categories",
                  })}
                </Text>
              </View>
              <Ionicons name="analytics-outline" size={20} color="#0D9E94" />
            </View>

            <View className="gap-3">
              {Object.entries(CLASS_CONFIGS).map(([key, config]) => {
                const count = metrics.classCounts[key] || 0;
                const percentage =
                  metrics.totalAssessments > 0
                    ? Math.round((count / metrics.totalAssessments) * 100)
                    : 0;

                return (
                  <View key={key}>
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="w-6 h-6 rounded-lg items-center justify-center"
                          style={{ backgroundColor: isDark ? "#1E293B" : config.bg }}
                        >
                          <Ionicons name={config.icon} size={14} color={config.color} />
                        </View>
                        <Text className="text-[13px] font-bold text-[#1B2B4B] dark:text-slate-200">
                          {config.label}
                        </Text>
                        <Text className="text-[12px] text-[#64748B] dark:text-slate-400">
                          ({config.full})
                        </Text>
                      </View>
                      <Text className="text-[12px] font-semibold text-[#1B2B4B] dark:text-slate-100">
                        {count} ({percentage}%)
                      </Text>
                    </View>

                    <View className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Clinical Insights Card */}
          <View className="bg-[#E6F7F5] dark:bg-teal-950/30 border border-[#C6EFEA] dark:border-teal-900/40 rounded-3xl p-5">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#0D9E94" />
              <Text className="text-[15px] font-bold text-[#0D9E94] dark:text-teal-300 ml-2">
                {t("reports:clinicalInsights", { defaultValue: "Clinical Summary & Notes" })}
              </Text>
            </View>
            <Text className="text-[13px] text-[#134E4A] dark:text-teal-200/80 leading-relaxed font-normal">
              {t("reports:insightsDesc", {
                defaultValue:
                  "Screening trends recorded locally on this device. All high risk findings should be triaged immediately to regional dermatologists or tele-dermatology referral hubs.",
              })}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function KPICard({
  icon,
  title,
  value,
  color,
  bg,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
      style={{ width: "48%" }}
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text className="text-[22px] font-black text-[#1B2B4B] dark:text-slate-100 tracking-tight">
        {value}
      </Text>
      <Text className="text-[12px] font-medium text-[#64748B] dark:text-slate-400 mt-0.5" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

function RiskProgressRow({
  icon,
  label,
  count,
  total,
  color,
  badgeBg,
  badgeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  total: number;
  color: string;
  badgeBg: string;
  badgeText: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={icon} size={15} color={color} />
          <Text className="text-[13px] font-bold text-[#1B2B4B] dark:text-slate-100">
            {label}
          </Text>
          <View
            className="px-2 py-0.2 rounded-full"
            style={{ backgroundColor: badgeBg }}
          >
            <Text className="text-[11px] font-bold" style={{ color: badgeText }}>
              {count}
            </Text>
          </View>
        </View>
        <Text className="text-[12px] font-semibold text-[#64748B] dark:text-slate-400">
          {percentage}%
        </Text>
      </View>
      <View className="h-2 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function PeriodTabButton({
  icon,
  label,
  isActive,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3.5 py-2 rounded-full border flex-row items-center gap-1.5 transition-all ${
        isActive
          ? "bg-[#0D9E94] border-[#0D9E94] shadow-sm"
          : "bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800"
      }`}
    >
      <Ionicons
        name={icon}
        size={14}
        color={isActive ? "#FFFFFF" : "#64748B"}
      />
      <Text
        className={`text-[12px] font-bold ${
          isActive ? "text-white" : "text-[#64748B] dark:text-slate-300"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
