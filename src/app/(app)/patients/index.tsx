import { PatientListItem } from "@/components/patient/PatientListItem";
import { PatientListSkeleton } from "@/components/patient/PatientListSkeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePatientsStore } from "@/features/patients/store";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";

type FilterTab = "all" | "synced" | "pending";

export default function PatientListScreen() {
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
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-4 pb-4 border-b border-gray-100 dark:border-slate-800/80">
        <Text className="text-2xl font-bold text-navy dark:text-slate-100">Patients</Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Manage and view all patients.
        </Text>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 dark:bg-slate-850 rounded-xl px-3 mt-4 border border-gray-100 dark:border-slate-800/80">
          <Text className="text-lg mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-base text-navy dark:text-slate-100"
            placeholder="Search patients by name or ID"
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable
            onPress={async () => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
            }}
            className="ml-2 p-1"
          >
            <Text className="text-lg text-gray-400">⚙️</Text>
          </Pressable>
        </View>

        {/* Filter tabs */}
        <View className="flex-row mt-3.5 gap-2">
          {(["all", "synced", "pending"] as FilterTab[]).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => handleFilterChange(filter)}
              className={`px-3.5 py-1.5 rounded-full ${
                activeFilter === filter
                  ? "bg-primary dark:bg-primary-600"
                  : "bg-gray-150 dark:bg-slate-800 border border-gray-200/20 dark:border-slate-700/50"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeFilter === filter ? "text-white" : "text-gray-600 dark:text-slate-350"
                }`}
              >
                {filter === "all"
                  ? `All (${counts.all})`
                  : filter === "synced"
                    ? `Synced (${counts.synced})`
                    : `Pending (${counts.pending})`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Patient List content */}
      {isLoading && filteredPatients.length === 0 ? (
        <PatientListSkeleton />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon={<Text className="text-4xl">👥</Text>}
          title="No patients yet"
          description="Add your first patient to get started."
          action={
            <Button
              title="Add Patient"
              onPress={handleCreatePatient}
              fullWidth={false}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PatientListItem
              patient={item}
              onPress={() => router.push(`/(app)/patients/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          className="bg-white dark:bg-slate-900"
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleCreatePatient}
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary dark:bg-primary-600 items-center justify-center shadow-lg border border-primary-100/10 dark:border-primary-500/10"
      >
        <Text className="text-white text-3xl font-light">+</Text>
      </Pressable>
    </View>
  );
}
