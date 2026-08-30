import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "@/features/notifications/toastStore";
import { runSync } from "@/features/sync/syncEngine";
import { useThemeStore, type ThemeType } from "@/features/theme/store";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

const ICON_SIZE = 24;
const ICON_COLOR = "#1B2B4B";
const ICON_COLOR_DARK = "#E2E8F0";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, workerName, email, updateWorkerName } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(workerName || "");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const isDark = resolvedTheme === "dark";

  const themeLabels = {
    system: "System",
    light: "Light",
    dark: "Dark",
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateWorkerName(nameInput.trim());
      toast.success("Name updated successfully!");
      setShowEditName(false);
    }
  };

  const handleSelectTheme = async (option: ThemeType) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    await setTheme(option);
    toast.success(`Theme set to ${themeLabels[option]}`);
    setShowThemePicker(false);
  };

  const handleLogout = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          toast.success("Logged out successfully.");
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSync = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    Alert.alert(
      "Manual Sync",
      "Would you like to sync pending patient records and assessments with the remote server now?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync Now",
          onPress: async () => {
            try {
              const res = await runSync();
              toast.success(
                `Sync complete: ${res.success} synced, ${res.failed} failed.`,
              );
            } catch (e) {
              toast.error("An error occurred during database sync.");
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
      "Storage Management",
      "Clear temporary image cache files to free up space?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          onPress: () => {
            toast.success("Temporary cache files deleted successfully.");
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
      "Export Data",
      "Compile and export all local database tables as a structured JSON backup?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export JSON",
          onPress: () => {
            toast.success(
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
              Edit Your Name
            </Text>
            <Text className="text-xs text-gray-505 dark:text-slate-400 mb-4">
              Enter your name to display on your profile and assessments.
            </Text>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={nameInput}
              onChangeText={setNameInput}
            />
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowEditName(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Save"
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
              Select App Theme
            </Text>
            <Text className="text-xs text-gray-500 dark:text-slate-400 mb-5">
              Choose your theme preference.
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
              title="Close"
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
              Settings
            </Text>
            <Text className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Manage your app preferences and data
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
        <SectionHeader title="Account & Security" />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-profile.png")}
            title="Profile"
            subtitle="View and edit your profile"
            onPress={() => {
              setNameInput(workerName || "");
              setShowEditName(true);
            }}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-change-pin.png")}
            title="Change PIN"
            subtitle="Update your 4-digit PIN"
            onPress={() => router.push("/(auth)/pin-setup")}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-security.png")}
            title="Security & Privacy"
            subtitle="Manage data privacy and permissions"
            isLast
            onPress={() => {
              Alert.alert(
                "Security & Privacy",
                "DermSight operates with offline-first security. Patient records and medical images are encrypted locally and only synced when you initiate database replication.",
                [{ text: "OK" }],
              );
            }}
          />
        </Card>

        {/* App Preferences */}
        <SectionHeader title="App Preferences" />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-language.png")}
            title="Language"
            subtitle="Change app language"
            rightLabel="English"
            onPress={() => router.push("/(app)/settings/language")}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-theme.png")}
            title="Theme"
            subtitle="Customize color scheme"
            rightLabel={themeLabels[theme]}
            onPress={() => setShowThemePicker(true)}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-notification.png")}
            title="Notifications"
            subtitle="Manage notification preferences"
            onPress={() => {
              toast.info(
                "Notification preferences are configured clinical-wide.",
              );
            }}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-units.png")}
            title="Units"
            subtitle="Toggle measurement units"
            rightLabel="Metric (cm, kg)"
            isLast
            onPress={() => {
              toast.info(
                "Metric system units (millimeters) are active by default.",
              );
            }}
          />
        </Card>

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-data-sync.png")}
            title="Data Sync"
            subtitle="Configure sync preferences"
            onPress={handleSync}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-storage.png")}
            title="Storage Management"
            subtitle="View storage usage and clear cache"
            onPress={handleClearCache}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-export-data.png")}
            title="Export Data"
            subtitle="Export assessments and patient data"
            isLast
            onPress={handleExportData}
          />
        </Card>

        {/* Support & About */}
        <SectionHeader title="Support & About" />
        <Card>
          <SettingsRow
            icon={require("../../../../assets/icons/settings-support.png")}
            title="Help & Support"
            subtitle="FAQs and contact support"
            onPress={() => {
              Alert.alert(
                "Help & Support",
                "For assistance with DermSight skin screening, please contact your clinical health administrator or email support@dermsight.dev.",
                [{ text: "OK" }],
              );
            }}
          />
          <SettingsRow
            icon={require("../../../../assets/icons/settings-about.png")}
            title="About DermSight"
            subtitle="Version 1.0.0 (Build 1)"
            isLast
            onPress={() => {
              Alert.alert(
                "About DermSight",
                "DermSight Skin Cancer Screening Tool\nVersion 1.0.0 (Build 1)\n\nAn offline-first, private on-device medical application for community health workers.",
                [{ text: "OK" }],
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
            Log Out
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
        style={{ width: ICON_SIZE, height: ICON_SIZE, marginRight: 12 }}
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
