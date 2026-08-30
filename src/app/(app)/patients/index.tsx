import { PatientListItem } from "@/components/patient/PatientListItem";
import { PatientListSkeleton } from "@/components/patient/PatientListSkeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePatientsStore } from "@/features/patients/store";
import { useDebounce } from "@/hooks/useDebounce";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FilterTab = "all" | "synced" | "pending";

export default function PatientListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { patients, loadPatients, searchPatients, isLoading } = usePatientsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    searchPatients(debouncedQuery);
  }, [debouncedQuery, searchPatients]);

  const handleFilterChange = async (filter: FilterTab) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setActiveFilter(filter);
  };

  const handleCreatePatient = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.push("/(app)/patients/new");
  };

  // Apply filter
  const filteredPatients = patients.filter((p) => {
    if (activeFilter === "synced") return p.syncStatus === "synced";
    if (activeFilter === "pending") return p.syncStatus === "pending";
    return true;
  });

  const counts = {
    all: patients.length,
    synced: patients.filter((p) => p.syncStatus === "synced").length,
    pending: patients.filter((p) => p.syncStatus === "pending").length,
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 bg-white dark:bg-slate-950">
        {/* Header Section */}
        <View className="px-5 pt-3 pb-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-1 pr-3">
              <Text className="text-[26px] font-bold text-[#1B2B4B] dark:text-slate-100 tracking-tight">
                {t("patients:title", { defaultValue: "Patients" })}
              </Text>
              <Text className="text-[14px] text-[#64748B] dark:text-slate-400 mt-0.5">
                {t("patients:subtitle", { defaultValue: "Manage and view all patients" })}
              </Text>
            </View>

            {/* Top Right Add Button (+) */}
            <Pressable
              onPress={handleCreatePatient}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-9 h-9 rounded-full bg-[#0D9E94] items-center justify-center shadow-sm active:opacity-85"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search Input */}
          <View className="flex-row items-center mt-3.5">
            <View className="flex-1 flex-row items-center bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-sm">
              <Image
                source={require("../../../../assets/icons/search-icon.png")}
                style={{ width: 18, height: 18, marginRight: 10 }}
                contentFit="contain"
                tintColor="#94A3B8"
              />
              <TextInput
                className="flex-1 text-[15px] text-[#1B2B4B] dark:text-slate-100 p-0"
                placeholder={t("patients:search", {
                  defaultValue: "Search patients by name or ID",
                })}
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="p-1"
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row items-center mt-3.5 gap-2.5">
            <FilterTabButton
              label={t("patients:allTab", { defaultValue: "All Patients" })}
              count={counts.all}
              isActive={activeFilter === "all"}
              onPress={() => handleFilterChange("all")}
            />
            <FilterTabButton
              label={t("patients:syncedTab", { defaultValue: "Synced" })}
              count={counts.synced}
              isActive={activeFilter === "synced"}
              onPress={() => handleFilterChange("synced")}
            />
            <FilterTabButton
              label={t("patients:pendingTab", { defaultValue: "Pending Sync" })}
              count={counts.pending}
              isActive={activeFilter === "pending"}
              onPress={() => handleFilterChange("pending")}
            />
          </View>
        </View>

        {/* Patient List Content */}
        <View className="flex-1 px-5 pt-1">
          {isLoading && filteredPatients.length === 0 ? (
            <PatientListSkeleton />
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              icon={
                <View className="w-16 h-16 rounded-full bg-[#E6F7F5] dark:bg-teal-950/40 items-center justify-center mb-1 border border-[#C6EFEA] dark:border-teal-900/30">
                  <Ionicons name="people-outline" size={32} color="#0D9E94" />
                </View>
              }
              title={t("patients:noPatients", { defaultValue: "No patients yet" })}
              description={t("patients:noPatientsDesc", {
                defaultValue: "Add your first patient to get started.",
              })}
              action={
                <Button
                  title={t("patients:addPatient", { defaultValue: "Add Patient" })}
                  onPress={handleCreatePatient}
                  fullWidth={false}
                />
              }
            />
          ) : (
            <FlatList
              data={filteredPatients}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <PatientListItem
                  patient={item}
                  onPress={() => router.push(`/(app)/patients/${item.id}`)}
                />
              )}
              contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function FilterTabButton({
  label,
  count,
  isActive,
  onPress,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl px-3.5 py-2 flex-row items-center gap-2 active:opacity-90 ${
        isActive
          ? "bg-[#0D9E94] dark:bg-[#0A7E76] shadow-sm"
          : "bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800"
      }`}
    >
      <Text
        className={`text-[13px] ${
          isActive
            ? "text-white font-semibold"
            : "text-[#64748B] dark:text-slate-400 font-medium"
        }`}
      >
        {label}
      </Text>
      <View
        className={`px-1.5 py-0.5 rounded-full min-w-[20px] items-center justify-center ${
          isActive
            ? "bg-white/25"
            : "bg-[#F1F5F9] dark:bg-slate-800"
        }`}
      >
        <Text
          className={`text-[11px] ${
            isActive
              ? "text-white font-bold"
              : "text-[#64748B] dark:text-slate-400 font-medium"
          }`}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}
