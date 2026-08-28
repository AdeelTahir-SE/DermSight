/**
 * Sync status hook — tracks pending sync count and sync state.
 */

import { useState, useEffect, useCallback } from "react";
import { getPendingCount, runSync } from "@/features/sync/syncEngine";
import { useConnectivity } from "./useConnectivity";

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const { isConnected } = useConnectivity();

  const refreshCount = useCallback(() => {
    const count = getPendingCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing || !isConnected) return;
    setIsSyncing(true);
    try {
      await runSync();
      setLastSynced(new Date().toISOString());
      refreshCount();
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isConnected, refreshCount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCount();
    }, 0);
    const interval = setInterval(refreshCount, 5000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refreshCount]);

  return {
    pendingCount,
    isSyncing,
    lastSynced,
    triggerSync,
    refreshCount,
  };
}
