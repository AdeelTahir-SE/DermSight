/**
 * Patient List screen — searchable/filterable list.
 */

import { PatientListItem } from "@/components/patient/PatientListItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePatientsStore } from "@/features/patients/store";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

type FilterTab = "all" | "synced" | "pending";

export default function PatientListScreen() {
  const router = useRouter();
  const { patients, loadPatients, searchPatients } = usePatientsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    searchPatients(debouncedQuery);
  }, [debouncedQuery, searchPatients]);

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
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-navy">Patients</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          Manage and view all patients.
        </Text>

        {/* Search */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-3 mt-4 border border-gray-100">
          <Text className="text-lg mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-base text-navy"
            placeholder="Search patients by name or ID"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable className="ml-2 p-1">
            <Text className="text-lg">⚙️</Text>
          </Pressable>
        </View>

        {/* Filter tabs */}
        <View className="flex-row mt-3 gap-2">
          {(["all", "synced", "pending"] as FilterTab[]).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full ${
                activeFilter === filter ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter ? "text-white" : "text-gray-600"
                }`}
              >
                {filter === "all"
                  ? `All Patients (${counts.all})`
                  : filter === "synced"
                    ? `Synced (${counts.synced})`
                    : `Pending Sync (${counts.pending})`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Patient List */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          icon={<Text className="text-4xl">👥</Text>}
          title="No patients yet"
          description="Add your first patient to get started."
          action={
            <Button
              title="Add Patient"
              onPress={() => router.push("/(app)/patients/new")}
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
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(app)/patients/new")}
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </Pressable>
    </View>
  );
}
