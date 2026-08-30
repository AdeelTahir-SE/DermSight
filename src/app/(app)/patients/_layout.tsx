/**
 * Patients layout — stack for patient screens.
 */

import { Stack } from "expo-router";

export default function PatientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[patientId]" />
    </Stack>
  );
}
