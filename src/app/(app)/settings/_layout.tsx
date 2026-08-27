/**
 * Settings layout — stack for settings screens.
 */

import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="language" />
      <Stack.Screen name="model-management" />
    </Stack>
  );
}
