/**
 * Root layout — wraps the entire app with providers.
 * NativeWind entry, DB init, auth state, i18n.
 */

import "@/lib/i18n";
import "../../global.css";

import { initializeDatabase } from "@/db/client";
import { useAuthStore } from "@/features/auth/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        initializeDatabase();
        setDbReady(true);
        await initialize();
      } catch (e) {
        console.error("Bootstrap error:", e);
        setDbReady(true);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  if (!isInitialized || !dbReady) {
    return <View className="flex-1 bg-white" />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top", "left", "right"]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
