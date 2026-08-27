/**
 * SyncQueueItem component — displays a single sync queue entry.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { SyncQueueItem as SyncQueueItemType } from '@/types';
import { formatRelativeDate } from '@/utils/date';

interface SyncQueueItemProps {
  item: SyncQueueItemType;
  onRetry?: () => void;
}

export function SyncQueueItemRow({ item, onRetry }: SyncQueueItemProps) {
  const statusConfig = {
    pending: { color: '#D97706', bg: '#FEF3C7', label: 'Pending' },
    in_progress: { color: '#2563EB', bg: '#DBEAFE', label: 'Syncing' },
    failed: { color: '#DC2626', bg: '#FEE2E2', label: 'Failed' },
    done: { color: '#16A34A', bg: '#DCFCE7', label: 'Done' },
  };

  const status = statusConfig[item.status];
  const entityLabel = item.entityType === 'patient' ? 'Patient' : 'Assessment';

  return (
    <View className="flex-row items-center bg-white p-4 border-b border-gray-50">
      <View className="flex-1">
        <Text className="text-sm font-medium text-navy">
          {item.operation === 'create' ? 'Create' : 'Update'} {entityLabel}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {item.entityId.substring(0, 12)}... • {item.attemptCount} attempts
        </Text>
      </View>

      <View className="items-end">
        <View
          className="px-2 py-0.5 rounded-full mb-1"
          style={{ backgroundColor: status.bg }}
        >
          <Text className="text-xs font-medium" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
        {item.status === 'failed' && onRetry && (
          <Pressable onPress={onRetry} className="mt-1">
            <Text className="text-xs text-primary font-medium">Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
