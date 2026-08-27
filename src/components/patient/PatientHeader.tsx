/**
 * PatientHeader — top section of patient detail screen.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import type { Patient } from "@/types";
import { calculateAge, formatDate } from "@/utils/date";

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const initials =
    `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const age = calculateAge(patient.dateOfBirth);

  return (
    <View className="bg-white p-5 border-b border-gray-100">
      <View className="flex-row items-center mb-4">
        <View className="w-16 h-16 rounded-full bg-primary-50 items-center justify-center mr-4">
          <Text className="text-primary font-bold text-xl">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-navy">
            {patient.firstName} {patient.lastName}
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            <Text className="text-sm text-gray-500">Active</Text>
          </View>
          <Text className="text-sm text-gray-400 mt-0.5">
            {patient.id.substring(0, 8).toUpperCase()} •{" "}
            {patient.sex === "male"
              ? "Male"
              : patient.sex === "female"
                ? "Female"
                : "Other"}{" "}
            • {age} yrs
          </Text>
          <Text className="text-xs text-gray-400">
            Registered on {formatDate(patient.createdAt)}
          </Text>
        </View>
      </View>

      {/* Quick actions */}
      <View className="flex-row justify-around bg-gray-50 rounded-xl py-3">
        <QuickAction icon="📞" label="Call" />
        <QuickAction icon="💬" label="Message" />
        <QuickAction icon="📍" label="Location" />
      </View>
    </View>
  );
}

function QuickAction({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable className="items-center">
      <View className="w-10 h-10 rounded-full bg-white items-center justify-center mb-1 shadow-sm">
        <Text className="text-lg">{icon}</Text>
      </View>
      <Text className="text-xs text-gray-600">{label}</Text>
    </Pressable>
  );
}
