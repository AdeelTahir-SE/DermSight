import { useThemeStore } from "@/features/theme/store";
import type { SyncQueueItem as SyncQueueItemType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface SyncQueueItemProps {
  item: SyncQueueItemType;
  onRetry?: () => void;
}

export function SyncQueueItemRow({ item, onRetry }: SyncQueueItemProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const isPatient = item.entityType === "patient";
  const entityTitle = isPatient
    ? item.operation === "create"
      ? t("sync:newPatientReg", { defaultValue: "New Patient Registration" })
      : t("sync:updatePatientRecord", { defaultValue: "Update Patient Record" })
    : item.operation === "create"
      ? t("sync:skinAssessment", { defaultValue: "Skin Lesion Assessment" })
      : t("sync:updateAssessment", { defaultValue: "Update Assessment" });

  // Formatted ID
  const displayId = item.entityId.startsWith("PID-")
    ? item.entityId
    : isPatient
      ? `PID-${item.entityId.replace(/[^0-9]/g, "").slice(0, 5).padStart(5, "0") || item.entityId.slice(0, 6).toUpperCase()}`
      : `ASM-${item.entityId.slice(0, 6).toUpperCase()}`;

  const handleRetryPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onRetry?.();
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 mb-3 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex-row items-center justify-between">
      {/* Left: Type Icon Avatar (Both with teal/mint palette, but distinct icons) */}
      <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5 bg-[#E6F7F5] dark:bg-teal-950/40 border border-[#C6EFEA] dark:border-teal-900/30">
        <Ionicons
          name={isPatient ? "person" : "medical"}
          size={22}
          color="#0D9E94"
        />
      </View>

      {/* Center: Details */}
      <View className="flex-1 mr-2">
        <Text className="text-[15px] font-bold text-[#1B2B4B] dark:text-slate-100">
          {entityTitle}
        </Text>
        <View className="flex-row items-center mt-1 flex-wrap">
          <Text className="text-[12px] font-medium text-[#64748B] dark:text-slate-400">
            {displayId}
          </Text>
          <Text className="text-[12px] text-[#94A3B8] dark:text-slate-500 mx-1.5">
            •
          </Text>
          <Text className="text-[12px] text-[#94A3B8] dark:text-slate-500 capitalize">
            {item.operation === "create" ? t("sync:create", { defaultValue: "create" }) : t("sync:update", { defaultValue: "update" })}
          </Text>
          {item.attemptCount > 0 && (
            <>
              <Text className="text-[12px] text-[#94A3B8] dark:text-slate-500 mx-1.5">
                •
              </Text>
              <Text className="text-[12px] text-[#94A3B8] dark:text-slate-500">
                {t("sync:attempts", { count: item.attemptCount })}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Right: Status Pill & Action */}
      <View className="items-end gap-1.5">
        {item.status === "done" ? (
          <View className="bg-[#E6F7F5] dark:bg-teal-950/40 border border-[#C6EFEA] dark:border-teal-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <Ionicons name="checkmark-circle" size={13} color="#0D9E94" />
            <Text className="text-[11px] font-semibold text-[#0D9E94] dark:text-teal-300">
              {t("sync:synced", { defaultValue: "Synced" })}
            </Text>
          </View>
        ) : item.status === "pending" ? (
          <View className="bg-[#FFF7ED] dark:bg-amber-950/40 border border-[#FED7AA] dark:border-amber-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <Ionicons name="time-outline" size={13} color="#EA580C" />
            <Text className="text-[11px] font-semibold text-[#EA580C] dark:text-amber-300">
              {t("sync:pending", { defaultValue: "Pending" })}
            </Text>
          </View>
        ) : item.status === "in_progress" ? (
          <View className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className="text-[11px] font-semibold text-blue-600 dark:text-blue-300">
              {t("sync:inProgress", { defaultValue: "Syncing" })}
            </Text>
          </View>
        ) : (
          <View className="items-end gap-1">
            <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
              <Ionicons name="alert-circle" size={13} color="#DC2626" />
              <Text className="text-[11px] font-semibold text-[#DC2626] dark:text-red-300">
                {t("sync:failed", { defaultValue: "Failed" })}
              </Text>
            </View>
            {onRetry && (
              <Pressable
                onPress={handleRetryPress}
                hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
                className="bg-[#0D9E94] px-2.5 py-0.5 rounded-full active:opacity-85"
              >
                <Text className="text-[11px] font-bold text-white">
                  {t("sync:retry", { defaultValue: "Retry" })}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
