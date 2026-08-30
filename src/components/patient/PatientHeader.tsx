import React from "react";
import { View, Text, Pressable } from "react-native";
import type { Patient } from "@/types";
import { calculateAge, formatDate } from "@/utils/date";
import * as Haptics from "expo-haptics";

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const initials =
    `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const age = calculateAge(patient.dateOfBirth);

  return (
    <View className="bg-white dark:bg-slate-900 p-5 border-b border-gray-100 dark:border-slate-800/80">
      <View className="flex-row items-center mb-4">
        <View className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/20 items-center justify-center mr-4 border border-primary-100/30 dark:border-primary-900/30">
          <Text className="text-primary dark:text-primary-400 font-bold text-xl">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-navy dark:text-slate-100">
            {patient.firstName} {patient.lastName}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            <Text className="text-sm text-gray-500 dark:text-slate-400">Active</Text>
          </View>
          <Text className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
            {patient.id.substring(0, 8).toUpperCase()} •{" "}
            {patient.sex === "male"
              ? "Male"
              : patient.sex === "female"
                ? "Female"
                : "Other"}{" "}
            • {age} yrs
          </Text>
          <Text className="text-xs text-gray-400 dark:text-slate-500">
            Registered on {formatDate(patient.createdAt)}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <View className="flex-row justify-around bg-gray-50 dark:bg-slate-850 rounded-2xl py-3 border border-gray-100/50 dark:border-slate-800/50">
        <QuickAction icon="📞" label="Call" />
        <QuickAction icon="💬" label="Message" />
        <QuickAction icon="📍" label="Location" />
      </View>
    </View>
  );
}

function QuickAction({ icon, label }: { icon: string; label: string }) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  return (
    <Pressable onPress={handlePress} className="items-center">
      <View className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 items-center justify-center mb-1 shadow-sm border border-gray-100/50 dark:border-slate-700/50">
        <Text className="text-lg">{icon}</Text>
      </View>
      <Text className="text-xs text-gray-600 dark:text-slate-400 font-medium">{label}</Text>
    </Pressable>
  );
}
