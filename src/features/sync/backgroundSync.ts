/**
 * Automatic & background sync.
 * - expo-task-manager + expo-background-task: periodic sync while backgrounded.
 * - NetInfo listener: immediate foreground sync whenever connectivity returns.
 */

import { notifySyncComplete } from "@/features/notifications/localNotifications";
import { toast } from "@/features/notifications/toastStore";
import { usePreferencesStore } from "@/features/preferences/store";
import i18n from "@/lib/i18n";
import { subscribeToConnectivity } from "@/lib/netinfo";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { getPendingCount, runSync } from "./syncEngine";

export const BACKGROUND_SYNC_TASK = "dermsight-background-sync";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    if (getPendingCount() === 0) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    const result = await runSync();
    await usePreferencesStore
      .getState()
      .setLastSyncedAt(new Date().toISOString());

    if (
      (result.success > 0 || result.failed > 0) &&
      usePreferencesStore.getState().notificationsEnabled
    ) {
      await notifySyncComplete(result.success, result.failed);
    }

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return;
    }

    const alreadyRegistered =
      await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!alreadyRegistered) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15,
      });
    }
  } catch {
    // Foreground auto-sync still applies when the native background service is unavailable.
  }
}

let unsubscribeConnectivity: (() => void) | null = null;
let autoSyncInFlight = false;

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
        await notifySyncComplete(result.success, result.failed);
      }
    }
  } catch {
    // Will retry on the next connectivity change or background cycle.
  } finally {
    autoSyncInFlight = false;
  }
}
