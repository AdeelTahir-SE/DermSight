import i18n from "@/lib/i18n";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export function configureLocalNotifications(): void {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sync", {
      name: "Sync status",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function notifySyncComplete(
  success: number,
  failed: number,
): Promise<void> {
  const allowed = await ensureNotificationPermissions();
  if (!allowed) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("sync:title"),
      body: i18n.t("sync:complete", { success, failed }),
      data: { url: "/(app)/assessments" },
    },
    trigger: null,
  });
}
