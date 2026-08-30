import { useThemeStore } from "@/features/theme/store";
import type { SyncQueueItem as SyncQueueItemType } from "@/types";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

interface SyncQueueItemProps {
  item: SyncQueueItemType;
  onRetry?: () => void;
}

export function SyncQueueItemRow({ item, onRetry }: SyncQueueItemProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";
  const statusConfig = {
    pending: { color: "#B45309", bg: isDark ? "#451A03" : "#FEF3C7", label: t("sync:pending") },
    in_progress: { color: "#2563EB", bg: isDark ? "#172554" : "#DBEAFE", label: t("sync:inProgress") },
    failed: { color: "#DC2626", bg: isDark ? "#450A0A" : "#FEE2E2", label: t("sync:failed") },
    done: { color: "#16A34A", bg: isDark ? "#052E16" : "#DCFCE7", label: t("sync:done") },
  };

  const status = statusConfig[item.status];
  const entityLabel = item.entityType === "patient" ? t("sync:patient") : t("sync:assessment");
  const operationLabel = item.operation === "create" ? t("sync:create") : t("sync:update");

  return (
    <View className="flex-row items-center bg-white dark:bg-slate-900 p-4 border-b border-gray-100 dark:border-slate-800">
      <Image source={require("../../../assets/icons/home-cloud.png")} style={{ width: 22, height: 22, marginRight: 12 }} contentFit="contain" tintColor={isDark ? "#E2E8F0" : "#1B2B4B"} />
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-navy dark:text-slate-100">{operationLabel} {entityLabel}</Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          {item.entityId.substring(0, 12)}... · {t("sync:attempts", { count: item.attemptCount })}
        </Text>
      </View>

      <View className="items-end">
        <View className="px-2 py-1 rounded-full mb-1" style={{ backgroundColor: status.bg }}>
          <Text className="text-xs font-semibold" style={{ color: status.color }}>{status.label}</Text>
        </View>
        {item.status === "failed" && onRetry && (
          <Pressable onPress={onRetry} className="mt-1">
            <Text className="text-sm text-primary dark:text-primary-400 font-semibold">{t("sync:retry")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
