/**
 * Patient detail layout — sub-stack for patient flow.
 */

import { Stack } from "expo-router";

export default function PatientDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="review" />
      <Stack.Screen name="result" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
