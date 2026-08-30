const fs = require("fs");
const p = "src/app/(app)/settings/index.tsx";
let s = fs.readFileSync(p, "utf8");
s = s.replace('import { Button } from "@/components/ui/Button";\n', 'import { Button } from "@/components/ui/Button";\nimport { getAllAssessments } from "@/features/assessments/repository";\nimport { getAllPatients } from "@/features/patients/repository";\n');
s = s.replace('import { toast } from "@/features/notifications/toastStore";\n', 'import { ensureNotificationPermissions } from "@/features/notifications/localNotifications";\nimport { toast } from "@/features/notifications/toastStore";\nimport { usePreferencesStore, type UnitsType } from "@/features/preferences/store";\n');
s = s.replace('import { runSync } from "@/features/sync/syncEngine";\n', 'import { getAllSyncItems, runSync } from "@/features/sync/syncEngine";\n');
s = s.replace('import * as Haptics from "expo-haptics";\n', 'import * as FileSystem from "expo-file-system/legacy";\nimport * as Haptics from "expo-haptics";\n');
s = s.replace('import { Image } from "expo-image";\n', 'import { Image } from "expo-image";\nimport * as Sharing from "expo-sharing";\n');
s = s.replace('import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";', 'import { Alert, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";');
s = s.replace('  const { theme, resolvedTheme, setTheme } = useThemeStore();\n', '  const { theme, resolvedTheme, setTheme } = useThemeStore();\n  const { notificationsEnabled, units, setNotificationsEnabled, setUnits } =\n    usePreferencesStore();\n');
s = s.replace(/  const handleClearCache = async \(\) => \{[\s\S]*?  const handleExportData = async \(\) => \{/, `  const handleToggleNotifications = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const next = !notificationsEnabled;
    if (next && Platform.OS !== "web") {
      const allowed = await ensureNotificationPermissions();
      if (!allowed) {
        toast.error(t("settings:notificationsDenied"));
        return;
      }
    }

    await setNotificationsEnabled(next);
    toast.success(
      next ? t("settings:notificationsOn") : t("settings:notificationsOff"),
    );
  };

  const handleToggleUnits = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const next: UnitsType = units === "metric" ? "imperial" : "metric";
    await setUnits(next);
    toast.success(
      t("settings:unitsSet", {
        units:
          next === "metric"
            ? t("settings:metricLabel")
            : t("settings:imperialLabel"),
      }),
    );
  };

  const getCacheBytes = async (): Promise<number> => {
    if (!FileSystem.cacheDirectory) return 0;
    try {
      const names = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
      const infos = await Promise.all(
        names.map((name) =>
          FileSystem.getInfoAsync(FileSystem.cacheDirectory + name, { size: true }),
        ),
      );
      return infos.reduce((total, info) => total + (info.exists ? info.size ?? 0 : 0), 0);
    } catch {
      return 0;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return \`\${bytes} B\`;
    if (bytes < 1024 * 1024) return \`\${(bytes / 1024).toFixed(1)} KB\`;
    return \`\${(bytes / 1024 / 1024).toFixed(1)} MB\`;
  };

  const handleClearCache = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(
      t("settings:storageManagement") || "Storage Management",
      t("settings:clearCacheConfirm") ||
        "Clear temporary image cache files to free up space?",
      [
        { text: t("common:cancel") || "Cancel", style: "cancel" },
        {
          text: t("settings:clearCache") || "Clear Cache",
          onPress: async () => {
            try {
              const size = await getCacheBytes();
              if (FileSystem.cacheDirectory) {
                const names = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
                await Promise.all(
                  names.map((name) =>
                    FileSystem.deleteAsync(FileSystem.cacheDirectory + name, {
                      idempotent: true,
                    }),
                  ),
                );
              }
              toast.success(
                t("settings:cacheCleared", { size: formatBytes(size) }),
              );
            } catch {
              toast.error(t("settings:cacheClearFailed"));
            }
          },
        },
      ],
    );
  };

  const handleExportData = async () => {`);
s = s.replace(/  const handleExportData = async \(\) => \{[\s\S]*?  return \(/, `  const handleExportData = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(
      t("settings:exportData") || "Export Data",
      t("settings:exportConfirm") ||
        "Compile and export all local database tables as a structured JSON backup?",
      [
        { text: t("common:cancel") || "Cancel", style: "cancel" },
        {
          text: t("settings:exportJson") || "Export JSON",
          onPress: async () => {
            try {
              if (!FileSystem.cacheDirectory) {
                toast.error(t("settings:exportFailed"));
                return;
              }

              const backup = {
                exportedAt: new Date().toISOString(),
                appVersion: "1.0.0",
                worker: { name: workerName, email },
                patients: await getAllPatients(),
                assessments: await getAllAssessments(),
                syncQueue: getAllSyncItems(),
              };
              const uri = `${FileSystem.cacheDirectory}dermsight-export-${Date.now()}.json`;
              await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));

              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                  mimeType: "application/json",
                  dialogTitle: t("settings:exportData"),
                });
              }
              toast.success(t("settings:exportSuccess"));
            } catch {
              toast.error(t("settings:exportFailed"));
            }
          },
        },
      ],
    );
  };

  return (`);
s = s.replace(`          <SettingsRow
            icon={require("../../../../assets/icons/settings-notification.png")}
            title={t("settings:notifications")}
            subtitle={t("settings:notificationsDesc")}
            onPress={() => {
              toast.info(
                t("settings:notificationsInfo") ||
                  "Notification preferences are configured clinical-wide.",
              );
            }}
          />`, `          <SettingsRow
            icon={require("../../../../assets/icons/settings-notification.png")}
            title={t("settings:notifications")}
            subtitle={t("settings:notificationsDesc")}
            rightLabel={notificationsEnabled ? t("common:on") : t("common:off")}
            onPress={handleToggleNotifications}
          />`);
s = s.replace(`          <SettingsRow
            icon={require("../../../../assets/icons/settings-units.png")}
            title={t("settings:units")}
            subtitle={t("settings:unitsDesc") || "Toggle measurement units"}
            rightLabel={t("settings:metricLabel") || "Metric (cm, kg)"}
            isLast
            onPress={() => {
              toast.info(
                t("settings:unitsInfo") ||
                  "Metric system units (millimeters) are active by default.",
              );
            }}
          />`, `          <SettingsRow
            icon={require("../../../../assets/icons/settings-units.png")}
            title={t("settings:units")}
            subtitle={t("settings:unitsDesc") || "Toggle measurement units"}
            rightLabel={
              units === "metric"
                ? t("settings:metricLabel")
                : t("settings:imperialLabel")
            }
            isLast
            onPress={handleToggleUnits}
          />`);
s = s.replace(`          <SettingsRow
            icon={require("../../../../assets/icons/settings-export-data.png")}
            title={t("settings:exportData")}
            subtitle={t("settings:exportDataDesc")}
            isLast
            onPress={handleExportData}
          />`, `          <SettingsRow
            icon={require("../../../../assets/icons/settings-export-data.png")}
            title={t("settings:exportData")}
            subtitle={t("settings:exportDataDesc")}
            onPress={handleExportData}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/ai-chip.png")}
            title={t("settings:modelManagement")}
            subtitle={t("settings:modelManagementDesc")}
            isLast
            onPress={() => router.push("/(app)/settings/model-management")}
          />`);
s = s.replace(/catch \(e\) \{\}/g, "catch {}");
fs.writeFileSync(p, s);
