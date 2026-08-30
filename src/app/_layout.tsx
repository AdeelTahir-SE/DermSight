/**
 * Root layout — wraps the entire app with providers.
 * NativeWind entry, DB init, auth state, i18n.
 */

import "@/lib/i18n";
import "../../global.css";

import { initializeDatabase } from "@/db/client";
import { useAuthStore } from "@/features/auth/store";
import { useThemeStore } from "@/features/theme/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { ToastContainer } from "@/components/ui/ToastContainer";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();
  const { resolvedTheme, initializeTheme } = useThemeStore();
  const { setColorScheme } = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initializeTheme();
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

  // Update NativeWind's active color scheme whenever resolvedTheme changes
  useEffect(() => {
    setColorScheme(resolvedTheme);
  }, [resolvedTheme, setColorScheme]);

  if (!isInitialized || !dbReady) {
    const isDark = resolvedTheme === "dark";
    return <View className={`flex-1 ${isDark ? "bg-[#0B0F19]" : "bg-white"}`} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ToastContainer />
      <SafeAreaView
        className="flex-1 bg-white dark:bg-slate-950"
        style={{ flex: 1, backgroundColor: isDark ? "#0B0F19" : "#FFFFFF" }}
        edges={["top", "left", "right"]}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
