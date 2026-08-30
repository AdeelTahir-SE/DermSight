/**
 * Automatic & background sync.
 * - expo-task-manager + expo-background-fetch: periodic sync while backgrounded.
 * - NetInfo listener: immediate foreground sync whenever connectivity returns.
 */

import { toast } from "@/features/notifications/toastStore";
import { usePreferencesStore } from "@/features/preferences/store";
import i18n from "@/lib/i18n";
import { subscribeToConnectivity } from "@/lib/netinfo";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { getPendingCount, runSync } from "./syncEngine";

export const BACKGROUND_SYNC_TASK = "dermsight-background-sync";

// Defined at module scope so the task exists when the OS wakes the app in background.
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    if (getPendingCount() === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    const result = await runSync();
    if (result.success > 0) {
      await usePreferencesStore
        .getState()
        .setLastSyncedAt(new Date().toISOString());
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the periodic background fetch task (min every 15 minutes,
 * actual cadence decided by the OS).
 */
export async function registerBackgroundSync(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }
    const alreadyRegistered =
      await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!alreadyRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch unavailable on this runtime — foreground auto-sync still applies.
  }
}

let unsubscribeConnectivity: (() => void) | null = null;
let autoSyncInFlight = false;

/**
 * Start foreground auto-sync: whenever the device regains connectivity,
 * pending records are pushed automatically. Returns a stop function.
 */
export function startConnectivityAutoSync(): () => void {
  if (unsubscribeConnectivity) return stopConnectivityAutoSync;
  unsubscribeConnectivity = subscribeToConnectivity((connected) => {
    if (connected) {
      void autoSync();
    }
  });
  return stopConnectivityAutoSync;
}

function stopConnectivityAutoSync(): void {
  unsubscribeConnectivity?.();
  unsubscribeConnectivity = null;
}

async function autoSync(): Promise<void> {
  if (autoSyncInFlight || getPendingCount() === 0) return;
  autoSyncInFlight = true;
  try {
    const result = await runSync();
    if (result.success > 0 || result.failed > 0) {
      await usePreferencesStore
        .getState()
        .setLastSyncedAt(new Date().toISOString());
      if (usePreferencesStore.getState().notificationsEnabled) {
        toast.info(
          i18n.t("sync:complete", {
            success: result.success,
            failed: result.failed,
          }),
        );
      }
    }
  } catch {
    // Will retry on the next connectivity change or background cycle.
  } finally {
    autoSyncInFlight = false;
  }
}
