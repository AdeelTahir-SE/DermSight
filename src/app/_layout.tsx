/**
 * Root layout — wraps the entire app with providers.
 * NativeWind entry, DB init, auth state, i18n.
 */

import i18n, { loadSavedLanguage } from "@/lib/i18n";
import "../../global.css";

import { ToastContainer } from "@/components/ui/ToastContainer";
import { initializeDatabase } from "@/db/client";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "@/features/notifications/toastStore";
import { configureLocalNotifications } from "@/features/notifications/localNotifications";
import { usePreferencesStore } from "@/features/preferences/store";
import {
    registerBackgroundSync,
    startConnectivityAutoSync,
} from "@/features/sync/backgroundSync";
import { useThemeStore } from "@/features/theme/store";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isInitialized } = useAuthStore();
  const { resolvedTheme, initializeTheme } = useThemeStore();
  const { setColorScheme } = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let stopAutoSync: (() => void) | undefined;
    async function bootstrap() {
      try {
        await initializeTheme();
        await loadSavedLanguage();
        configureLocalNotifications();
        await usePreferencesStore.getState().initializePreferences();
        initializeDatabase();
        setDbReady(true);
        await initialize();
        // Automatic sync: on reconnect (foreground) + periodic background task
        stopAutoSync = startConnectivityAutoSync();
        void registerBackgroundSync();
      } catch {
        setDbReady(true);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
    return () => {
      stopAutoSync?.();
    };
  }, []);

  // Handle deep links from email confirmation redirect
  useEffect(() => {
    async function handleDeepLink(url: string | null) {
      if (!url) return;

      try {
        if (
          url.includes("access_token") ||
          url.includes("#") ||
          url.includes("type=signup") ||
          url.includes("type=recovery") ||
          url.includes("type=magiclink") ||
          url.includes("type=email")
        ) {
          const hashOrQuery = url.includes("#") ? url.split("#")[1] : url.split("?")[1] || "";
          const params = new URLSearchParams(hashOrQuery);
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error && data.session?.user) {
              const res = await useAuthStore.getState().handleSessionFromDeepLink(data.session.user);
              toast.success("Email verified successfully!");
              if (res.pinSet) {
                router.replace("/(app)/home" as any);
              } else {
                router.replace("/(auth)/pin-setup" as any);
              }
              return;
            }
          }
        }

        if (url.includes("code=")) {
          const queryPart = url.split("?")[1] || "";
          const params = new URLSearchParams(queryPart);
          const code = params.get("code");
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session?.user) {
              const res = await useAuthStore.getState().handleSessionFromDeepLink(data.session.user);
              toast.success("Email verified successfully!");
              if (res.pinSet) {
                router.replace("/(app)/home" as any);
              } else {
                router.replace("/(auth)/pin-setup" as any);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to process deep link URL:", err);
      }
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Update NativeWind's active color scheme whenever resolvedTheme changes
  useEffect(() => {
    setColorScheme(resolvedTheme);
  }, [resolvedTheme, setColorScheme]);

  if (!isInitialized || !dbReady) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ToastContainer />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}


