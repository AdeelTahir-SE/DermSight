import { SyncQueueItemRow } from "@/components/sync/SyncQueueItem";
import { getAllSyncItems, retrySyncItem } from "@/features/sync/syncEngine";
import { useThemeStore } from "@/features/theme/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import type { SyncQueueItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterTab = "all" | "pending" | "done" | "failed";

export default function SyncScreen() {
  const { t } = useTranslation();
  const { pendingCount, isSyncing, lastSynced, triggerSync } = useSyncStatus();
  const { isOffline } = useConnectivity();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const [syncItems, setSyncItems] = useState<SyncQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(() => {
    setSyncItems(getAllSyncItems());
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadItems, 0);
    return () => clearTimeout(timer);
  }, [pendingCount, isSyncing, loadItems]);

  const counts = useMemo(() => {
    return {
      all: syncItems.length,
      pending: syncItems.filter((i) => i.status === "pending" || i.status === "in_progress").length,
      done: syncItems.filter((i) => i.status === "done").length,
      failed: syncItems.filter((i) => i.status === "failed").length,
    };
  }, [syncItems]);

  const filteredItems = useMemo(() => {
    if (activeTab === "pending") {
      return syncItems.filter((i) => i.status === "pending" || i.status === "in_progress");
    }
    if (activeTab === "done") {
      return syncItems.filter((i) => i.status === "done");
    }
    if (activeTab === "failed") {
      return syncItems.filter((i) => i.status === "failed");
    }
    return syncItems;
  }, [syncItems, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    loadItems();
    setRefreshing(false);
  };

  const handleTriggerSync = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await triggerSync();
    loadItems();
  };

  const handleRetry = async (itemId: number) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await retrySyncItem(itemId);
    await triggerSync();
    loadItems();
  };

  const handleTabPress = async (tab: FilterTab) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(tab);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 bg-[#F8FAFC] dark:bg-slate-950">
        {/* Header */}
        <View className="bg-white dark:bg-slate-900 px-5 pt-3 pb-3 border-b border-[#EBF2F1] dark:border-slate-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-[24px] font-bold text-[#1B2B4B] dark:text-slate-100 tracking-tight" numberOfLines={1}>
                {t("sync:title", { defaultValue: "Data Sync" })}
              </Text>
              <Text className="text-[13px] text-[#64748B] dark:text-slate-400 mt-0.5" numberOfLines={1}>
                {t("sync:subtitle", { defaultValue: "Offline queue & cloud synchronization" })}
              </Text>
            </View>
            <View className="flex-row items-center shrink-0 bg-[#F1F5F9] dark:bg-slate-800 px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-slate-700/60">
              <View
                className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-[#10B981]"} mr-1.5`}
              />
              <Text className="text-[12px] text-[#64748B] dark:text-slate-300 font-semibold">
                {isOffline ? t("sync:offline", { defaultValue: "Offline" }) : t("sync:online", { defaultValue: "Online" })}
              </Text>
            </View>
          </View>
        </View>

        {/* Hero Card */}
        <View className="p-5 pb-2">
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <View className="flex-row items-start justify-between">
              <View className="w-12 h-12 rounded-2xl bg-[#E6F7F5] dark:bg-teal-950/50 items-center justify-center border border-[#C6EFEA] dark:border-teal-900/40">
                <Ionicons
                  name={pendingCount === 0 ? "cloud-done" : "cloud-upload"}
                  size={24}
                  color="#0D9E94"
                />
              </View>
              {pendingCount === 0 ? (
                <View className="bg-[#E6F7F5] dark:bg-teal-950/40 border border-[#C6EFEA] dark:border-teal-900/40 rounded-full px-3 py-1 flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={14} color="#0D9E94" />
                  <Text className="text-[12px] font-bold text-[#0D9E94] dark:text-teal-300">
                    {t("sync:upToDate", { defaultValue: "Up to date" })}
                  </Text>
                </View>
              ) : (
                <View className="bg-[#FFF7ED] dark:bg-amber-950/40 border border-[#FED7AA] dark:border-amber-900/40 rounded-full px-3 py-1 flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color="#EA580C" />
                  <Text className="text-[12px] font-bold text-[#EA580C] dark:text-amber-300">
                    {t("sync:pendingItems", { count: pendingCount, defaultValue: `${pendingCount} Pending` })}
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-4">
              <Text className="text-[18px] font-bold text-[#1B2B4B] dark:text-slate-100">
                {pendingCount === 0
                  ? t("sync:allSynced", { defaultValue: "All Records Synced" })
                  : t("sync:pendingItemsFull", {
                      count: pendingCount,
                      defaultValue: `${pendingCount} item${pendingCount === 1 ? "" : "s"} waiting for sync`,
                    })}
              </Text>
              <Text className="text-[13px] text-[#64748B] dark:text-slate-400 mt-1">
                {lastSynced
                  ? `${t("sync:lastSynced", { defaultValue: "Last synced" })}: ${new Date(lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • ${new Date(lastSynced).toLocaleDateString([], { month: "short", day: "numeric" })}`
                  : t("sync:autoSyncDesc", { defaultValue: "Sync automatically occurs when connected" })}
              </Text>
            </View>

            {/* Sync Action Button */}
            <Pressable
              onPress={handleTriggerSync}
              disabled={isOffline || isSyncing}
              className={`mt-5 py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2 ${
                isOffline
                  ? "bg-gray-100 dark:bg-slate-800 opacity-60"
                  : "bg-[#0D9E94] active:opacity-90 shadow-[0_2px_8px_rgba(13,158,148,0.25)]"
              }`}
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-[15px] font-bold text-white">
                    {t("sync:syncing", { defaultValue: "Syncing Records..." })}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sync" size={18} color={isOffline ? "#94A3B8" : "#FFFFFF"} />
                  <Text
                    className={`text-[15px] font-bold ${
                      isOffline ? "text-gray-400 dark:text-slate-500" : "text-white"
                    }`}
                  >
                    {pendingCount === 0
                      ? t("sync:syncNow", { defaultValue: "Sync Now" })
                      : t("sync:uploadItems", {
                          count: pendingCount,
                          defaultValue: `Upload ${pendingCount} Item${pendingCount === 1 ? "" : "s"}`,
                        })}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Offline Warning Banner */}
        {isOffline && (
          <View className="px-5 mb-2">
            <View className="flex-row items-center bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-900/40 rounded-2xl p-3.5">
              <Ionicons name="cloud-offline" size={20} color="#D97706" />
              <Text className="text-[13px] text-[#B45309] dark:text-amber-300 ml-2.5 flex-1 font-medium leading-relaxed">
                {t("sync:offlineNotice", {
                  defaultValue: "Device is currently offline. All data is saved securely on this device and will sync when reconnected.",
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View className="px-5 py-2">
          <View className="flex-row items-center gap-2">
            <FilterTabButton
              label={t("sync:allTab", { defaultValue: "All" })}
              count={counts.all}
              isActive={activeTab === "all"}
              onPress={() => handleTabPress("all")}
            />
            <FilterTabButton
              label={t("sync:pendingTab", { defaultValue: "Pending" })}
              count={counts.pending}
              isActive={activeTab === "pending"}
              onPress={() => handleTabPress("pending")}
            />
            <FilterTabButton
              label={t("sync:syncedTab", { defaultValue: "Synced" })}
              count={counts.done}
              isActive={activeTab === "done"}
              onPress={() => handleTabPress("done")}
            />
            {counts.failed > 0 && (
              <FilterTabButton
                label={t("sync:failedTab", { defaultValue: "Failed" })}
                count={counts.failed}
                isActive={activeTab === "failed"}
                onPress={() => handleTabPress("failed")}
                isError
              />
            )}
          </View>
        </View>

        {/* Queue Items List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <SyncQueueItemRow
              item={item}
              onRetry={item.status === "failed" ? () => handleRetry(item.id) : undefined}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0D9E94"
              colors={["#0D9E94"]}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View className="w-16 h-16 rounded-full bg-[#E6F7F5] dark:bg-teal-950/40 items-center justify-center mb-3.5 border border-[#C6EFEA] dark:border-teal-900/30">
                <Ionicons name="checkmark-done" size={30} color="#0D9E94" />
              </View>
              <Text className="text-[17px] font-bold text-[#1B2B4B] dark:text-slate-100 text-center">
                {activeTab === "all"
                  ? t("sync:cleanQueue", { defaultValue: "Sync Queue is Clean" })
                  : activeTab === "pending"
                    ? t("sync:noPending", { defaultValue: "No Pending Records" })
                    : activeTab === "failed"
                      ? t("sync:noFailed", { defaultValue: "No Failed Items" })
                      : t("sync:noRecordsFound", { defaultValue: "No Records Found" })}
              </Text>
              <Text className="text-[13px] text-[#64748B] dark:text-slate-400 text-center mt-1 max-w-[240px]">
                {activeTab === "all" || activeTab === "pending"
                  ? t("sync:cleanQueueDesc", {
                      defaultValue: "All patient data and skin assessments are backed up and up to date.",
                    })
                  : t("sync:noRecordsFoundDesc", { defaultValue: "Items in this state will appear here." })}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function FilterTabButton({
  label,
  count,
  isActive,
  isError = false,
  onPress,
}: {
  label: string;
  count: number;
  isActive: boolean;
  isError?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-3.5 py-2 rounded-full border transition-all ${
        isActive
          ? isError
            ? "bg-red-500 border-red-500 shadow-sm"
            : "bg-[#0D9E94] border-[#0D9E94] shadow-sm"
          : "bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800"
      }`}
    >
      <Text
        className={`text-[13px] font-bold mr-1.5 ${
          isActive ? "text-white" : "text-[#64748B] dark:text-slate-300"
        }`}
      >
        {label}
      </Text>
      <View
        className={`px-1.5 py-0.2 rounded-full ${
          isActive
            ? "bg-white/20"
            : "bg-[#F1F5F9] dark:bg-slate-800"
        }`}
      >
        <Text
          className={`text-[11px] font-bold ${
            isActive ? "text-white" : "text-[#64748B] dark:text-slate-400"
          }`}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}
