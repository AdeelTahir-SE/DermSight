import { EmptyState } from "@/components/ui/EmptyState";
import { SyncQueueItemRow } from "@/components/sync/SyncQueueItem";
import { Button } from "@/components/ui/Button";
import { getAllSyncItems, retrySyncItem } from "@/features/sync/syncEngine";
import { useThemeStore } from "@/features/theme/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import type { SyncQueueItem } from "@/types";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, Text, View } from "react-native";

export default function SyncScreen() {
  const { t } = useTranslation();
  const { pendingCount, isSyncing, lastSynced, triggerSync } = useSyncStatus();
  const { isOffline } = useConnectivity();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";
  const [syncItems, setSyncItems] = useState<SyncQueueItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(() => {
    setSyncItems(getAllSyncItems());
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadItems, 0);
    return () => clearTimeout(timer);
  }, [pendingCount, loadItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    loadItems();
    setRefreshing(false);
  };

  const handleRetry = async (itemId: number) => {
    await retrySyncItem(itemId);
    loadItems();
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <View className="bg-white dark:bg-slate-900 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-slate-800">
        <Text className="text-2xl font-bold text-navy dark:text-slate-100">{t("sync:title")}</Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{t("sync:subtitle")}</Text>

        <View className="mt-4 bg-primary-50 dark:bg-primary-950/20 rounded-2xl p-4 flex-row items-center">
          <Image source={require("../../../../assets/icons/home-cloud.png")} style={{ width: 28, height: 28, marginRight: 12 }} contentFit="contain" tintColor="#0D9E94" />
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-primary-800 dark:text-primary-300">
              {pendingCount === 0 ? t("sync:allSynced") : t("sync:pendingItems", { count: pendingCount })}
            </Text>
            {lastSynced && (
              <Text className="text-sm text-primary-700 dark:text-primary-400 mt-0.5">
                {t("sync:lastSynced")}: {new Date(lastSynced).toLocaleString()}
              </Text>
            )}
          </View>
          <Button title={isSyncing ? t("sync:syncing") : t("sync:syncNow")} onPress={triggerSync} loading={isSyncing} disabled={isOffline || isSyncing} size="sm" fullWidth={false} />
        </View>

        {isOffline && (
          <View className="mt-3 flex-row items-center bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3">
            <Image source={require("../../../../assets/icons/offline-cloud.png")} style={{ width: 20, height: 20, marginRight: 8 }} contentFit="contain" tintColor={isDark ? "#FBBF24" : "#B45309"} />
            <Text className="text-sm text-amber-705 dark:text-amber-300">{t("sync:noConnection")}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={syncItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SyncQueueItemRow item={item} onRetry={item.status === "failed" ? () => handleRetry(item.id) : undefined} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Image source={require("../../../../assets/icons/home-checklist.png")} style={{ width: 44, height: 44 }} contentFit="contain" tintColor="#0D9E94" />}
            title={t("sync:allSynced")}
            description={t("sync:emptyDesc")}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
