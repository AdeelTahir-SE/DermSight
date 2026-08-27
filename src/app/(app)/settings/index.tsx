/**
 * Settings screen — language, model, account, data export, logout.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, workerName } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-navy">Settings</Text>
      </View>

      <View className="p-5">
        {/* Account & Security */}
        <SectionHeader title="Account & Security" />
        <SettingsRow icon="👤" title="Profile" subtitle="View and edit your profile." />
        <SettingsRow icon="🔒" title="Change PIN" subtitle="Update your 4-digit PIN." />
        <SettingsRow icon="🛡️" title="Security & Privacy" subtitle="Manage data privacy and permissions." />

        {/* App Preferences */}
        <SectionHeader title="App Preferences" />
        <SettingsRow
          icon="🌍"
          title="Language"
          subtitle=""
          rightLabel="English"
          onPress={() => router.push('/(app)/settings/language')}
        />
        <SettingsRow icon="🌙" title="Theme" subtitle="" rightLabel="System" />
        <SettingsRow icon="🔔" title="Notifications" subtitle="Manage notification preferences." />
        <SettingsRow icon="📏" title="Units" subtitle="" rightLabel="Metric (cm, kg)" />

        {/* Data & Storage */}
        <SectionHeader title="Data & Storage" />
        <SettingsRow icon="☁️" title="Data Sync" subtitle="Configure sync preferences." />
        <SettingsRow icon="💾" title="Storage Management" subtitle="View storage usage and clear cache." />
        <SettingsRow icon="📤" title="Export Data" subtitle="Export assessments and patient data." />

        {/* Support & About */}
        <SectionHeader title="Support & About" />
        <SettingsRow icon="❓" title="Help & Support" subtitle="FAQs and contact support." />
        <SettingsRow icon="ℹ️" title="About DermSight" subtitle="Version 1.0.0 (Build 1)" />

        {/* Log Out */}
        <View className="mt-6">
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center justify-center bg-red-50 rounded-2xl py-4 border border-red-100"
          >
            <Text className="text-lg mr-2">🔓</Text>
            <Text className="text-red-600 font-semibold text-base">Log Out</Text>
          </Pressable>
        </View>

        <View className="h-24" />
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-sm font-semibold text-primary mt-6 mb-2">{title}</Text>
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
      className="flex-row items-center bg-white p-4 border-b border-gray-50"
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
