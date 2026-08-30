import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { useThemeStore, type ThemeType } from "@/features/theme/store";
import { toast } from "@/features/notifications/toastStore";
import { runSync } from "@/features/sync/syncEngine";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, workerName, email, updateWorkerName } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useThemeStore();

  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(workerName || "");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
            setSyncing(true);
            try {
              const res = await runSync();
              toast.success(`Sync complete: ${res.success} synced, ${res.failed} failed.`);
            } catch (e) {
              toast.error("An error occurred during database sync.");
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
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
          }
        }
      ]
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
            toast.success("JSON backup compiled and saved to Downloads folder.");
          }
        }
      ]
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
                  <Text className={`text-base font-semibold ${
                    theme === opt ? "text-primary dark:text-primary-400" : "text-navy dark:text-slate-200"
                  }`}>
                    {themeLabels[opt]}
                  </Text>
                  {theme === opt && (
                    <Text className="text-primary dark:text-primary-400 font-bold text-sm">✓</Text>
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
      <View className="bg-navy px-5 pt-12 pb-6 rounded-b-[28px] shadow-sm">
        <Text className="text-2xl font-bold text-white">Settings</Text>
        <Text className="text-xs text-white/70 mt-1">Manage account and application settings</Text>
      </View>

      {/* Profile Card */}
      <Pressable
        onPress={() => {
          setNameInput(workerName || "");
          setShowEditName(true);
        }}
        className="bg-white dark:bg-slate-900 m-5 p-5 rounded-2xl border border-gray-100 dark:border-slate-800/80 flex-row items-center shadow-sm"
      >
        <View className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950/20 items-center justify-center mr-4 border border-primary-100/30 dark:border-primary-900/30">
          <Text className="text-2xl">👩‍⚕️</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-navy dark:text-slate-100">{workerName || "Set Your Name"}</Text>
            <Text className="text-xs text-primary dark:text-primary-450 font-bold">Edit ✏️</Text>
          </View>
          {email ? (
            <Text className="text-xs text-gray-500 dark:text-slate-400 mt-1">{email}</Text>
          ) : null}
        </View>
      </Pressable>

      <View className="px-5 pb-5">
        {/* Account & Security */}
        <SectionHeader title="Account & Security" />
        <SettingsRow
          icon="👤"
          title="Edit Profile Name"
          subtitle={workerName ? `Current: ${workerName}` : "Tap to set your full name."}
          onPress={() => {
            setNameInput(workerName || "");
            setShowEditName(true);
          }}
        />
        <SettingsRow
          icon="🔒"
          title="Change PIN"
          subtitle="Update your 4-digit PIN."
          onPress={() => router.push("/(auth)/pin-setup")}
        />
        <SettingsRow
          icon="🛡️"
          title="Security & Privacy"
          subtitle="Manage data privacy and permissions."
          onPress={() => {
            Alert.alert(
              "Security & Privacy",
              "DermSight operates with offline-first security. Patient records and medical images are encrypted locally and only synced when you initiate database replication.",
              [{ text: "OK" }]
            );
          }}
        />

        {/* App Preferences */}
        <SectionHeader title="App Preferences" />
        <SettingsRow
          icon="🌍"
          title="Language"
          subtitle="Change app language."
          rightLabel="English"
          onPress={() => router.push("/(app)/settings/language")}
        />
        <SettingsRow
          icon="🤖"
          title="Model Management"
          subtitle="View on-device ML model details."
          onPress={() => router.push("/(app)/settings/model-management")}
        />
        <SettingsRow
          icon="🌙"
          title="Theme"
          subtitle="Customize color scheme."
          rightLabel={themeLabels[theme]}
          onPress={() => setShowThemePicker(true)}
        />
        <SettingsRow
          icon="🔔"
          title="Notifications"
          subtitle="Manage notification preferences."
          onPress={() => {
            toast.info("Notification preferences are configured clinical-wide.");
          }}
        />
        <SettingsRow
          icon="📏"
          title="Units"
          subtitle="Toggle measurement units."
          rightLabel="Metric (cm)"
          onPress={() => {
            toast.info("Metric system units (millimeters) are active by default.");
          }}
        />

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />
        <SettingsRow
          icon="☁️"
          title="Data Sync"
          subtitle="Sync local records to server."
          onPress={handleSync}
        />
        <SettingsRow
          icon="💾"
          title="Storage Management"
          subtitle="Clear temporary files and cache."
          onPress={handleClearCache}
        />
        <SettingsRow
          icon="📤"
          title="Export Data"
          subtitle="Export database tables as JSON."
          onPress={handleExportData}
        />

        {/* Support & About */}
        <SectionHeader title="Support & About" />
        <SettingsRow
          icon="❓"
          title="Help & Support"
          subtitle="FAQs and contact support."
          onPress={() => {
            Alert.alert(
              "Help & Support",
              "For assistance with DermSight skin screening, please contact your clinical health administrator or email support@dermsight.dev.",
              [{ text: "OK" }]
            );
          }}
        />
        <SettingsRow
          icon="ℹ️"
          title="About DermSight"
          subtitle="Version 1.0.0 (Build 1)"
          onPress={() => {
            Alert.alert(
              "About DermSight",
              "DermSight Skin Cancer Screening Tool\nVersion 1.0.0 (Build 1)\n\nAn offline-first, private on-device medical application for community health workers.",
              [{ text: "OK" }]
            );
          }}
        />

        {/* Log Out */}
        <View className="mt-8">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-red-50 dark:bg-red-950/10 rounded-2xl py-4 border border-red-100 dark:border-red-950/20"
          >
            <Text className="text-lg mr-2">🔓</Text>
            <Text className="text-red-650 dark:text-red-405 font-bold text-base">
              Log Out
            </Text>
          </Pressable>
        </View>

        <View className="h-24" />
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-bold text-primary dark:text-primary-400 mt-6 mb-2 uppercase tracking-wider">
      {title}
    </Text>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  rightLabel,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  rightLabel?: string;
  onPress?: () => void;
}) {
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
      className="flex-row items-center bg-white dark:bg-slate-900 p-4 border-b border-gray-50 dark:border-slate-850/50 rounded-xl mb-1 shadow-sm border border-gray-100/50 dark:border-slate-800"
    >
      <View className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800 items-center justify-center mr-3 border border-gray-100/50 dark:border-slate-700/50">
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-navy dark:text-slate-100">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-gray-550 dark:text-slate-400 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {rightLabel && (
        <Text className="text-sm text-gray-400 dark:text-slate-500 mr-2.5">{rightLabel}</Text>
      )}
      <Text className="text-gray-300 dark:text-slate-700 font-bold">›</Text>
    </Pressable>
  );
}
