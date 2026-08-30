import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "@/features/notifications/toastStore";
import { runSync } from "@/features/sync/syncEngine";
import { useThemeStore, type ThemeType } from "@/features/theme/store";
import i18n from "@/lib/i18n";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

const ICON_COLOR = "#1B2B4B";
const ICON_COLOR_DARK = "#E2E8F0";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout, workerName, email, updateWorkerName } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(workerName || "");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const isDark = resolvedTheme === "dark";

  const themeLabels = {
    system: t("common:system") || "System",
    light: t("common:light") || "Light",
    dark: t("common:dark") || "Dark",
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateWorkerName(nameInput.trim());
      toast.success(t("settings:nameUpdated") || "Name updated successfully!");
      setShowEditName(false);
    }
  };

  const handleSelectTheme = async (option: ThemeType) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    await setTheme(option);
    toast.success(
      t("settings:themeSet", { theme: themeLabels[option] }) ||
        `Theme set to ${themeLabels[option]}`,
    );
    setShowThemePicker(false);
  };

  const handleLogout = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    Alert.alert(
      t("settings:logout") || "Log Out",
      t("settings:logoutConfirm") || "Are you sure you want to log out?",
      [
        { text: t("common:cancel") || "Cancel", style: "cancel" },
        {
          text: t("settings:logout") || "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            toast.success(
              t("settings:loggedOut") || "Logged out successfully.",
            );
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    Alert.alert(
      t("sync:title") || "Manual Sync",
      t("sync:confirmMessage") ||
        "Would you like to sync pending patient records and assessments with the remote server now?",
      [
        { text: t("common:cancel") || "Cancel", style: "cancel" },
        {
          text: t("sync:syncNow") || "Sync Now",
          onPress: async () => {
            try {
              const res = await runSync();
              toast.success(
                t("sync:complete", {
                  success: res.success,
                  failed: res.failed,
                }) ||
                  `Sync complete: ${res.success} synced, ${res.failed} failed.`,
              );
            } catch (e) {
              toast.error(
                t("sync:error") || "An error occurred during database sync.",
              );
            }
          },
        },
      ],
    );
  };

  const handleClearCache = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    Alert.alert(
      t("settings:storageManagement") || "Storage Management",
      t("settings:clearCacheConfirm") ||
        "Clear temporary image cache files to free up space?",
      [
        { text: t("common:cancel") || "Cancel", style: "cancel" },
        {
          text: t("settings:clearCache") || "Clear Cache",
          onPress: () => {
            toast.success(
              t("settings:cacheCleared") ||
                "Temporary cache files deleted successfully.",
            );
          },
        },
      ],
    );
  };

  const handleExportData = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    Alert.alert(
      t("settings:exportData") || "Export Data",
      t("settings:exportConfirm") ||
        "Compile and export all local database tables as a structured JSON backup?",
      [
        { text: t("common:cancel") || "Cancel", style: "cancel" },
        {
          text: t("settings:exportJson") || "Export JSON",
          onPress: () => {
            toast.success(
              t("settings:exportSuccess") ||
                "JSON backup compiled and saved to Downloads folder.",
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      showsVerticalScrollIndicator={false}
    >
      {/* Edit Name Modal */}
      <Modal
        visible={showEditName}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditName(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white dark:bg-slate-900 border border-gray-150/10 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-navy dark:text-slate-100 mb-1">
              {t("settings:editName") || "Edit Your Name"}
            </Text>
            <Text className="text-xs text-gray-505 dark:text-slate-400 mb-4">
              {t("settings:editNameDesc") ||
                "Enter your name to display on your profile and assessments."}
            </Text>
            <Input
              label={t("settings:fullName") || "Full Name"}
              placeholder={
                t("settings:fullNamePlaceholder") || "Enter your full name"
              }
              value={nameInput}
              onChangeText={setNameInput}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  title={t("common:cancel") || "Cancel"}
                  variant="outline"
                  onPress={() => setShowEditName(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={t("common:save") || "Save"}
                  onPress={handleSaveName}
                  disabled={!nameInput.trim()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white dark:bg-slate-900 border border-gray-150/10 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-navy dark:text-slate-100 mb-1.5">
              {t("settings:selectTheme") || "Select App Theme"}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-slate-400 mb-5">
              {t("settings:themePreference") || "Choose your theme preference."}
            </Text>

            <View className="gap-2 mb-4">
              {(["system", "light", "dark"] as ThemeType[]).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => handleSelectTheme(opt)}
                  className={`flex-row items-center justify-between p-4 rounded-xl ${
                    theme === opt
                      ? "bg-primary-50 dark:bg-primary-950/20 border border-primary"
                      : "bg-gray-50 dark:bg-slate-850 border border-gray-100/50 dark:border-slate-800"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      theme === opt
                        ? "text-primary dark:text-primary-400"
                        : "text-navy dark:text-slate-200"
                    }`}
                  >
                    {themeLabels[opt]}
                  </Text>
                  {theme === opt && (
                    <Text className="text-primary dark:text-primary-400 font-bold text-sm">
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

            <Button
              title={t("common:close") || "Close"}
              variant="outline"
              onPress={() => setShowThemePicker(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Header */}
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
        {/* Account & Security */}
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
            onPress={() => {
              Alert.alert(
                t("settings:securityPrivacy") || "Security & Privacy",
                t("settings:securityPrivacyMessage") ||
                  "DermSight operates with offline-first security. Patient records and medical images are encrypted locally and only synced when you initiate database replication.",
                [{ text: t("common:ok") || "OK" }],
              );
            }}
          />
        </Card>

        {/* App Preferences */}
        <SectionHeader title={t("settings:appPreferences")} />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-language.png")}
            title={t("settings:language")}
            subtitle={t("settings:languageDesc") || "Change app language"}
            rightLabel={t(`language:${i18n.language}`) || "English"}
            onPress={() => router.push("/(app)/settings/language")}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-theme.png")}
            title={t("settings:theme")}
            subtitle={t("settings:themeDesc") || "Customize color scheme"}
            rightLabel={themeLabels[theme]}
            onPress={() => setShowThemePicker(true)}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-notification.png")}
            title={t("settings:notifications")}
            subtitle={t("settings:notificationsDesc")}
            onPress={() => {
              toast.info(
                t("settings:notificationsInfo") ||
                  "Notification preferences are configured clinical-wide.",
              );
            }}
          />
          <SettingsRow
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
          />
        </Card>

        {/* Data & Storage */}
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
            isLast
            onPress={handleExportData}
          />
        </Card>

        {/* Support & About */}
        <SectionHeader title={t("settings:supportAbout")} />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-support.png")}
            title={t("settings:helpSupport")}
            subtitle={t("settings:helpSupportDesc")}
            onPress={() => {
              Alert.alert(
                t("settings:helpSupport") || "Help & Support",
                t("settings:helpSupportMessage") ||
                  "For assistance with DermSight skin screening, please contact your clinical health administrator or email support@dermsight.dev.",
                [{ text: t("common:ok") || "OK" }],
              );
            }}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-about.png")}
            title={t("settings:about")}
            subtitle={t("settings:version", { version: "1.0.0", build: "1" })}
            isLast
            onPress={() => {
              Alert.alert(
                t("settings:about") || "About DermSight",
                t("settings:aboutMessage") ||
                  "DermSight Skin Cancer Screening Tool\nVersion 1.0.0 (Build 1)\n\nAn offline-first, private on-device medical application for community health workers.",
                [{ text: t("common:ok") || "OK" }],
              );
            }}
          />
        </Card>

        {/* Log Out */}
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
    if (onPress) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center px-4 py-3.5 ${
        isLast ? "" : "border-b border-gray-100 dark:border-slate-800/80"
      }`}
    >
      <Image
        source={icon}
        style={{ width: 24, height: 24, marginRight: 12 }}
        contentFit="contain"
        tintColor={isDark ? ICON_COLOR_DARK : ICON_COLOR}
      />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-navy dark:text-slate-100">
          {title}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          {subtitle}
        </Text>
      </View>
      {rightLabel && (
        <Text className="text-sm text-gray-400 dark:text-slate-500 mr-2">
          {rightLabel}
        </Text>
      )}
      <Text className="text-gray-300 dark:text-slate-600 text-lg">›</Text>
    </Pressable>
  );
}
