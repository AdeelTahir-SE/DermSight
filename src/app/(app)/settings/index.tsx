import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAllAssessments } from "@/features/assessments/repository";
import { useAuthStore } from "@/features/auth/store";
import { ensureNotificationPermissions } from "@/features/notifications/localNotifications";
import { toast } from "@/features/notifications/toastStore";
import { getAllPatients } from "@/features/patients/repository";
import {
  usePreferencesStore,
  type UnitsType,
} from "@/features/preferences/store";
import { getAllSyncItems, runSync } from "@/features/sync/syncEngine";
import { useThemeStore, type ThemeType } from "@/features/theme/store";
import i18n from "@/lib/i18n";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const ICON_COLOR = "#1B2B4B";
const ICON_COLOR_DARK = "#E2E8F0";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout, workerName, email, updateWorkerName } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const { notificationsEnabled, units, setNotificationsEnabled, setUnits } =
    usePreferencesStore();

  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(workerName || "");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const isDark = resolvedTheme === "dark";

  const themeLabels = {
    system: t("common:system"),
    light: t("common:light"),
    dark: t("common:dark"),
  };

  const unitLabel =
    units === "metric"
      ? t("settings:metricLabel")
      : t("settings:imperialLabel");

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateWorkerName(nameInput.trim());
      toast.success(t("settings:nameUpdated"));
      setShowEditName(false);
    }
  };

  const handleSelectTheme = async (option: ThemeType) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await setTheme(option);
    toast.success(t("settings:themeSet", { theme: themeLabels[option] }));
    setShowThemePicker(false);
  };

  const handleToggleNotifications = async () => {
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

  const handleLogout = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    Alert.alert(t("settings:logout"), t("settings:logoutConfirm"), [
      { text: t("common:cancel"), style: "cancel" },
      {
        text: t("settings:logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          toast.success(t("settings:loggedOut"));
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSync = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(t("sync:title"), t("sync:confirmMessage"), [
      { text: t("common:cancel"), style: "cancel" },
      {
        text: t("sync:syncNow"),
        onPress: async () => {
          try {
            const res = await runSync();
            toast.success(
              t("sync:complete", { success: res.success, failed: res.failed }),
            );
          } catch {
            toast.error(t("sync:error"));
          }
        },
      },
    ]);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getCacheBytes = async () => {
    if (!FileSystem.cacheDirectory) return 0;
    try {
      const names = await FileSystem.readDirectoryAsync(
        FileSystem.cacheDirectory,
      );
      const infos = await Promise.all(
        names.map((name) =>
          FileSystem.getInfoAsync(FileSystem.cacheDirectory + name, {
            size: true,
          }),
        ),
      );
      return infos.reduce(
        (total, info) => total + (info.exists ? (info.size ?? 0) : 0),
        0,
      );
    } catch {
      return 0;
    }
  };

  const handleClearCache = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(
      t("settings:storageManagement"),
      t("settings:clearCacheConfirm"),
      [
        { text: t("common:cancel"), style: "cancel" },
        {
          text: t("settings:clearCache"),
          onPress: async () => {
            try {
              const size = await getCacheBytes();
              if (FileSystem.cacheDirectory) {
                const names = await FileSystem.readDirectoryAsync(
                  FileSystem.cacheDirectory,
                );
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

  const handleExportData = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(t("settings:exportData"), t("settings:exportConfirm"), [
      { text: t("common:cancel"), style: "cancel" },
      {
        text: t("settings:exportJson"),
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
            await FileSystem.writeAsStringAsync(
              uri,
              JSON.stringify(backup, null, 2),
            );
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
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      showsVerticalScrollIndicator={false}
    >
      <Modal
        visible={showEditName}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditName(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white dark:bg-slate-900 border border-gray-150/10 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-navy dark:text-slate-100 mb-1">
              {t("settings:editName")}
            </Text>
            <Text className="text-xs text-gray-505 dark:text-slate-400 mb-4">
              {t("settings:editNameDesc")}
            </Text>
            <Input
              label={t("settings:fullName")}
              placeholder={t("settings:fullNamePlaceholder")}
              value={nameInput}
              onChangeText={setNameInput}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  title={t("common:cancel")}
                  variant="outline"
                  onPress={() => setShowEditName(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={t("common:save")}
                  onPress={handleSaveName}
                  disabled={!nameInput.trim()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white dark:bg-slate-900 border border-gray-150/10 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-navy dark:text-slate-100 mb-1.5">
              {t("settings:selectTheme")}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-slate-400 mb-5">
              {t("settings:themePreference")}
            </Text>
            <View className="gap-2 mb-4">
              {(["system", "light", "dark"] as ThemeType[]).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => handleSelectTheme(opt)}
                  className={`flex-row items-center justify-between p-4 rounded-xl ${theme === opt ? "bg-primary-50 dark:bg-primary-950/20 border border-primary" : "bg-gray-50 dark:bg-slate-850 border border-gray-100/50 dark:border-slate-800"}`}
                >
                  <Text
                    className={`text-base font-semibold ${theme === opt ? "text-primary dark:text-primary-400" : "text-navy dark:text-slate-200"}`}
                  >
                    {themeLabels[opt]}
                  </Text>
                  {theme === opt && (
                    <Image
                      source={require("../../../../assets/icons/home-checklist.png")}
                      style={{ width: 18, height: 18 }}
                      contentFit="contain"
                      tintColor={isDark ? "#33BFAF" : "#0D9E94"}
                    />
                  )}
                </Pressable>
              ))}
            </View>
            <Button
              title={t("common:close")}
              variant="outline"
              onPress={() => setShowThemePicker(false)}
            />
          </View>
        </View>
      </Modal>

      <View className="bg-white dark:bg-slate-900 px-5 pt-12 pb-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-navy dark:text-slate-100">
              {t("settings:title")}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {t("settings:subtitle")}
            </Text>
          </View>
          <Image
            source={require("../../../../assets/icons/settings-header-profile.png")}
            style={{ width: 40, height: 40 }}
            contentFit="contain"
            tintColor={isDark ? ICON_COLOR_DARK : ICON_COLOR}
          />
        </View>
      </View>

      <View className="px-5 pb-8">
        <SectionHeader title={t("settings:accountSecurity")} />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-profile.png")}
            title={t("settings:profile")}
            subtitle={t("settings:profileDesc")}
            onPress={() => {
              setNameInput(workerName || "");
              setShowEditName(true);
            }}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-change-pin.png")}
            title={t("settings:changePin")}
            subtitle={t("settings:changePinDesc")}
            onPress={() => router.push("/(auth)/pin-setup")}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-security.png")}
            title={t("settings:securityPrivacy")}
            subtitle={t("settings:securityPrivacyDesc")}
            isLast
            onPress={() =>
              Alert.alert(
                t("settings:securityPrivacy"),
                t("settings:securityPrivacyMessage"),
                [{ text: t("common:ok") }],
              )
            }
          />
        </Card>

        <SectionHeader title={t("settings:appPreferences")} />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-language.png")}
            title={t("settings:language")}
            subtitle={t("settings:languageDesc")}
            rightLabel={t(`language:${i18n.language}`)}
            onPress={() => router.push("/(app)/settings/language")}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-theme.png")}
            title={t("settings:theme")}
            subtitle={t("settings:themeDesc")}
            rightLabel={themeLabels[theme]}
            onPress={() => setShowThemePicker(true)}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-notification.png")}
            title={t("settings:notifications")}
            subtitle={t("settings:notificationsDesc")}
            rightLabel={notificationsEnabled ? t("common:on") : t("common:off")}
            onPress={handleToggleNotifications}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-units.png")}
            title={t("settings:units")}
            subtitle={t("settings:unitsDesc")}
            rightLabel={unitLabel}
            isLast
            onPress={handleToggleUnits}
          />
        </Card>

        <SectionHeader title={t("settings:dataStorage")} />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-data-sync.png")}
            title={t("settings:dataSync")}
            subtitle={t("settings:dataSyncDesc")}
            onPress={handleSync}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-storage.png")}
            title={t("settings:storageManagement")}
            subtitle={t("settings:storageManagementDesc")}
            onPress={handleClearCache}
          />
          <SettingsRow
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
          />
        </Card>

        <SectionHeader title={t("settings:supportAbout")} />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-support.png")}
            title={t("settings:helpSupport")}
            subtitle={t("settings:helpSupportDesc")}
            onPress={() =>
              Alert.alert(
                t("settings:helpSupport"),
                t("settings:helpSupportMessage"),
                [{ text: t("common:ok") }],
              )
            }
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-about.png")}
            title={t("settings:about")}
            subtitle={t("settings:version", { version: "1.0.0", build: "1" })}
            isLast
            onPress={() =>
              Alert.alert(t("settings:about"), t("settings:aboutMessage"), [
                { text: t("common:ok") },
              ])
            }
          />
        </Card>

        <Pressable
          onPress={handleLogout}
          className="mt-6 flex-row items-center justify-center bg-red-50 dark:bg-red-950/10 rounded-2xl py-4 border border-red-100 dark:border-red-950/20"
        >
          <Image
            source={require("../../../../assets/icons/settings-logout.png")}
            style={{ width: 20, height: 20, marginRight: 8 }}
            contentFit="contain"
            tintColor="#DC2626"
          />
          <Text className="text-red-600 dark:text-red-400 font-semibold text-base">
            {t("settings:logout")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-sm font-semibold text-primary dark:text-primary-400 mt-6 mb-2">
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800/80">
      {children}
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  rightLabel,
  isLast,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  rightLabel?: string;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const handlePress = async () => {
    if (!onPress) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center px-4 py-4 ${isLast ? "" : "border-b border-gray-100 dark:border-slate-800/80"}`}
    >
      <Image
        source={icon}
        style={{ width: 24, height: 24, marginRight: 12 }}
        contentFit="contain"
        tintColor={isDark ? ICON_COLOR_DARK : ICON_COLOR}
      />
      <View className="flex-1 pr-2">
        <Text className="text-base font-semibold text-navy dark:text-slate-100">
          {title}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </Text>
      </View>
      {rightLabel && (
        <Text className="text-sm text-gray-500 dark:text-slate-400 mr-2 max-w-[120px] text-right">
          {rightLabel}
        </Text>
      )}
      <Image
        source={require("../../../../assets/icons/np-chevron.png")}
        style={{ width: 16, height: 16 }}
        contentFit="contain"
        tintColor={isDark ? "#64748B" : "#94A3B8"}
      />
    </Pressable>
  );
}
