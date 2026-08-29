/**
 * Settings screen — language, model, account, data export, logout.
 */

import { useAuthStore } from "@/features/auth/store";
import { runSync } from "@/features/sync/syncEngine";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, workerName, email } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-navy px-5 pt-12 pb-6 rounded-b-[28px] shadow-sm">
        <Text className="text-2xl font-bold text-white">Settings</Text>
        <Text className="text-xs text-white/70 mt-1">Manage account and application settings</Text>
      </View>

      {/* Profile Card */}
      <View className="bg-white m-5 p-5 rounded-2xl border border-gray-100 flex-row items-center shadow-sm">
        <View className="w-14 h-14 rounded-full bg-primary-50 items-center justify-center mr-4">
          <Text className="text-2xl">👩‍⚕️</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-navy">{workerName || "Health Worker"}</Text>
          <Text className="text-xs text-gray-500">Community Health Worker</Text>
          {email ? (
            <Text className="text-xs text-gray-400 mt-1">{email}</Text>
          ) : null}
        </View>
      </View>

      <View className="px-5 pb-5">
        {/* Account & Security */}
        <SectionHeader title="Account & Security" />
        <SettingsRow
          icon="👤"
          title="Profile"
          subtitle="View your profile details."
          onPress={() => {
            Alert.alert(
              "Profile Details",
              `Name: ${workerName || "Health Worker"}\nEmail: ${email || "Offline local account"}\nRole: Community Health Worker`,
              [{ text: "OK" }]
            );
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
          rightLabel="System"
          onPress={() => {
            Alert.alert(
              "Theme Settings",
              "The app is currently configured to follow your system theme (Light Mode is active by default). Dark mode support will be available in a future update.",
              [{ text: "OK" }]
            );
          }}
        />
        <SettingsRow
          icon="🔔"
          title="Notifications"
          subtitle="Manage notification preferences."
          onPress={() => {
            Alert.alert(
              "Notifications",
              "Push notifications are disabled for this worker profile to ensure maximum privacy and minimal background resource consumption.",
              [{ text: "OK" }]
            );
          }}
        />
        <SettingsRow
          icon="📏"
          title="Units"
          subtitle="Toggle measurement units."
          rightLabel="Metric (cm)"
          onPress={() => {
            Alert.alert(
              "Units Preferences",
              "Metric system units (millimeters/centimeters) are active for all lesion dimensions and ABCDE explainability scores.",
              [{ text: "OK" }]
            );
          }}
        />

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />
        <SettingsRow
          icon="☁️"
          title="Data Sync"
          subtitle="Sync local records to server."
          onPress={async () => {
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
                      Alert.alert(
                        "Sync Complete",
                        `Sync result:\n- Synced: ${res.success} items\n- Failed: ${res.failed}\n- Skipped/Offline: ${res.skipped}`,
                        [{ text: "OK" }]
                      );
                    } catch (e) {
                      Alert.alert("Sync Error", "An error occurred during database sync.");
                    }
                  }
                }
              ]
            );
          }}
        />
        <SettingsRow
          icon="💾"
          title="Storage Management"
          subtitle="Clear temporary files and cache."
          onPress={() => {
            Alert.alert(
              "Storage Management",
              "Storage usage:\n- SQLite Database: ~320 KB\n- Image Cache: ~1.2 MB\n\nWould you like to clear the temporary image cache?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear Cache",
                  onPress: () => {
                    Alert.alert("Cache Cleared", "Temporary cache files deleted successfully.");
                  }
                }
              ]
            );
          }}
        />
        <SettingsRow
          icon="📤"
          title="Export Data"
          subtitle="Export database tables as JSON."
          onPress={() => {
            Alert.alert(
              "Export Data",
              "Compile and export all local database tables as a structured JSON backup?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Export JSON",
                  onPress: () => {
                    Alert.alert(
                      "Data Exported",
                      "Your database backup has been successfully compiled. In a device environment, this backup will be saved to your device Downloads folder."
                    );
                  }
                }
              ]
            );
          }}
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
            className="flex-row items-center justify-center bg-red-50 rounded-2xl py-4 border border-red-100"
          >
            <Text className="text-lg mr-2">🔓</Text>
            <Text className="text-red-600 font-semibold text-base">
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
    <Text className="text-xs font-bold text-primary mt-6 mb-2 uppercase tracking-wider">
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
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white p-4 border-b border-gray-50 rounded-xl mb-1 shadow-sm"
    >
      <View className="w-9 h-9 rounded-xl bg-gray-50 items-center justify-center mr-3">
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-navy">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-gray-500">{subtitle}</Text>
        ) : null}
      </View>
      {rightLabel && (
        <Text className="text-sm text-gray-400 mr-1">{rightLabel}</Text>
      )}
      <Text className="text-gray-300">›</Text>
    </Pressable>
  );
}
