/**
 * Sync Queue / Status screen — manual sync, per-item status, failed-item retry.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useConnectivity } from '@/hooks/useConnectivity';
import { getAllSyncItems, retrySyncItem } from '@/features/sync/syncEngine';
import { SyncQueueItemRow } from '@/components/sync/SyncQueueItem';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { SyncQueueItem } from '@/types';

export default function SyncScreen() {
  const { pendingCount, isSyncing, lastSynced, triggerSync, refreshCount } = useSyncStatus();
  const { isOffline } = useConnectivity();
  const [syncItems, setSyncItems] = useState<SyncQueueItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(() => {
    const items = getAllSyncItems();
    setSyncItems(items);
  }, []);

  React.useEffect(() => {
    loadItems();
  }, [pendingCount]);

  const handleRefresh = async () => {
    setRefreshing(true);
    loadItems();
    setRefreshing(false);
  };

  const handleRetry = async (itemId: number) => {
    await retrySyncItem(itemId);
    loadItems();
  };

  const pendingItems = syncItems.filter(i => i.status === 'pending' || i.status === 'in_progress');
  const failedItems = syncItems.filter(i => i.status === 'failed');
  const doneItems = syncItems.filter(i => i.status === 'done');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-navy">Sync Queue</Text>
        <Text className="text-sm text-gray-500 mt-0.5">Manage data synchronization.</Text>

        {/* Status card */}
        <View className="mt-4 bg-primary-50 rounded-2xl p-4 flex-row items-center">
          <View className="flex-1">
            <Text className="text-sm font-medium text-primary-800">
              {pendingCount === 0 ? 'All data is synced' : `${pendingCount} items pending`}
            </Text>
            {lastSynced && (
              <Text className="text-xs text-primary-600 mt-0.5">
                Last synced: {new Date(lastSynced).toLocaleString()}
              </Text>
            )}
          </View>
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync Now'}
            onPress={triggerSync}
            loading={isSyncing}
            disabled={isOffline || isSyncing}
            size="sm"
            fullWidth={false}
          />
        </View>

        {isOffline && (
          <View className="mt-3 flex-row items-center bg-amber-50 rounded-xl p-3">
            <Text className="text-sm mr-2">📡</Text>
            <Text className="text-xs text-amber-700">No internet connection</Text>
          </View>
        )}
      </View>

      <FlatList
        data={syncItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SyncQueueItemRow
            item={item}
            onRetry={item.status === 'failed' ? () => handleRetry(item.id) : undefined}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Text className="text-4xl">☁️</Text>}
            title="All data is synced"
            description="No items in the sync queue."
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
