import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Patient } from "@/types";
import { calculateAge, formatDate } from "@/utils/date";

interface PatientListItemProps {
  patient: Patient;
  lastAssessmentDate?: string;
  onPress: () => void;
}

const AVATAR_PALETTES = [
  { bg: "bg-[#D5F2EC] dark:bg-teal-950/70", text: "text-[#0D9E94] dark:text-teal-300" },
  { bg: "bg-[#ECE6F7] dark:bg-purple-950/70", text: "text-[#7C3AED] dark:text-purple-300" },
  { bg: "bg-[#FEF3C7] dark:bg-amber-950/70", text: "text-[#D97706] dark:text-amber-300" },
  { bg: "bg-[#E0F2FE] dark:bg-sky-950/70", text: "text-[#0284C7] dark:text-sky-300" },
  { bg: "bg-[#D1FAE5] dark:bg-emerald-950/70", text: "text-[#059669] dark:text-emerald-300" },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function getGenderIcon(sex?: string) {
  if (sex === "male") {
    return require("../../../assets/icons/male-gender-icon.png");
  }
  if (sex === "female") {
    return require("../../../assets/icons/female-gender-icon.png");
  }
  return require("../../../assets/icons/others-gender-icon.png");
}

export function PatientListItem({
  patient,
  lastAssessmentDate,
  onPress,
}: PatientListItemProps) {
  const initials = `${(patient.firstName || "")[0] || ""}${(patient.lastName || "")[0] || ""}`.toUpperCase() || "P";
  const age = calculateAge(patient.dateOfBirth);
  const sexLabel =
    patient.sex === "male"
      ? "Male"
      : patient.sex === "female"
        ? "Female"
        : "Other";

  const palette = getAvatarPalette(`${patient.firstName} ${patient.lastName}`);
  
  // Format Patient ID (PID-00012 style)
  const displayId = patient.id.startsWith("PID-")
    ? patient.id
    : `PID-${patient.id.replace(/[^0-9]/g, "").slice(0, 5).padStart(5, "0") || patient.id.slice(0, 6).toUpperCase()}`;

  const assessmentDate = lastAssessmentDate || patient.capturedAt || patient.createdAt;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 mb-3 border border-[#EBF2F1] dark:border-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex-row items-center justify-between active:opacity-90"
    >
      {/* Left: Avatar with pastel background */}
      <View
        className={`w-12 h-12 rounded-full ${palette.bg} items-center justify-center mr-3.5`}
      >
        <Text className={`${palette.text} font-bold text-[15px]`}>{initials}</Text>
      </View>

      {/* Center: Info */}
      <View className="flex-1 mr-2">
        <Text className="text-[16px] font-bold text-[#1B2B4B] dark:text-slate-100">
          {patient.firstName} {patient.lastName}
        </Text>
        <View className="flex-row items-center mt-0.5 flex-wrap">
          <Text className="text-[13px] text-[#64748B] dark:text-slate-400">
            {displayId}  •  
          </Text>
          <Image
            source={getGenderIcon(patient.sex)}
            style={{ width: 14, height: 14, marginRight: 3, marginLeft: 2 }}
            contentFit="contain"
            tintColor="#64748B"
          />
          <Text className="text-[13px] text-[#64748B] dark:text-slate-400">
            {sexLabel}, {age} yrs
          </Text>
        </View>
        {assessmentDate && (
          <Text className="text-[12px] text-[#94A3B8] dark:text-slate-500 mt-0.5">
            Last assessment: {formatDate(assessmentDate)}
          </Text>
        )}
      </View>

      {/* Right: Status badge & Chevron */}
      <View className="flex-row items-center gap-1.5">
        {patient.syncStatus === "synced" ? (
          <View className="bg-[#E6F7F5] dark:bg-teal-950/40 border border-[#C6EFEA] dark:border-teal-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <Ionicons name="checkmark-circle-outline" size={13} color="#0D9E94" />
            <Text className="text-[11px] font-medium text-[#0D9E94] dark:text-teal-300">
              Synced
            </Text>
          </View>
        ) : patient.syncStatus === "pending" ? (
          <View className="bg-[#FFF7ED] dark:bg-amber-950/40 border border-[#FED7AA] dark:border-amber-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <Ionicons name="time-outline" size={13} color="#EA580C" />
            <Text className="text-[11px] font-medium text-[#EA580C] dark:text-amber-300">
              Pending
            </Text>
          </View>
        ) : (
          <View className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-full px-2.5 py-1 flex-row items-center gap-1">
            <Ionicons name="alert-circle-outline" size={13} color="#DC2626" />
            <Text className="text-[11px] font-medium text-[#DC2626] dark:text-red-300">
              Failed
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </Pressable>
  );
}
