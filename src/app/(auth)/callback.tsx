/**
 * Supabase Auth Callback Screen
 * Handles email confirmation and magic link redirects across Web and Native.
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/features/auth/store";
import { useThemeStore } from "@/features/theme/store";
import { toast } from "@/features/notifications/toastStore";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();

  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function processCallback() {
      try {
        // 1. Check for errors passed in URL
        if (searchParams.error || searchParams.error_description) {
          throw new Error(searchParams.error_description || searchParams.error || "Verification failed");
        }

        let code = searchParams.code;
        let accessToken = searchParams.access_token;
        let refreshToken = searchParams.refresh_token;

        // 2. On Web, inspect window.location for hash fragment or query params
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const hash = window.location.hash ? window.location.hash.substring(1) : "";
          if (hash) {
            const hashParams = new URLSearchParams(hash);
            accessToken = accessToken || hashParams.get("access_token") || undefined;
            refreshToken = refreshToken || hashParams.get("refresh_token") || undefined;
            const hashError = hashParams.get("error_description") || hashParams.get("error");
            if (hashError) {
              throw new Error(decodeURIComponent(hashError));
            }
          }
          if (!code && window.location.search) {
            const queryParams = new URLSearchParams(window.location.search);
            code = queryParams.get("code") || undefined;
          }
        }

        // 3. On Native, check Linking.getInitialURL() if params were not in searchParams
        if (!code && !accessToken) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const hashPart = initialUrl.includes("#") ? initialUrl.split("#")[1] : "";
            const queryPart = initialUrl.includes("?") ? initialUrl.split("?")[1] : "";

            if (hashPart) {
              const hashParams = new URLSearchParams(hashPart);
              accessToken = accessToken || hashParams.get("access_token") || undefined;
              refreshToken = refreshToken || hashParams.get("refresh_token") || undefined;
            }
            if (queryPart) {
              const queryParams = new URLSearchParams(queryPart);
              code = code || queryParams.get("code") || undefined;
            }
          }
        }

        // 4. Exchange PKCE code for session
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session?.user) {
            return await finishVerification(data.session.user);
          }
        }

        // 5. Set session with tokens from hash fragment
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (data.session?.user) {
            return await finishVerification(data.session.user);
          }
        }

        // 6. Fallback: check if Supabase client already has an active session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          return await finishVerification(sessionData.session.user);
        }

        // If no code, tokens, or existing session found
        throw new Error("No authentication credentials found in redirect link.");
      } catch (err: any) {
        console.error("Auth callback verification error:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Failed to confirm email.");
        }
      }
    }

    async function finishVerification(user: any) {
      if (!isMounted) return;
      const res = await useAuthStore.getState().handleSessionFromDeepLink(user);
      setStatus("success");
      toast.success("Email verified successfully!");

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      // Navigate to next appropriate screen
      setTimeout(() => {
        if (!isMounted) return;
        if (res?.pinSet) {
          router.replace("/(app)/home" as any);
        } else {
          router.replace("/(auth)/pin-setup" as any);
        }
      }, 1200);
    }

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <View className="flex-1 items-center justify-center px-8">
        {status === "verifying" && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-3xl bg-[#E6F7F5] dark:bg-teal-950/40 items-center justify-center mb-5 border border-[#C6EFEA] dark:border-teal-900/40">
              <ActivityIndicator size="large" color="#0D9E94" />
            </View>
            <Text className="text-xl font-bold text-[#1B2B4B] dark:text-slate-100 mb-2">
              Verifying Email
            </Text>
            <Text className="text-sm text-[#64748B] dark:text-slate-400 text-center leading-relaxed max-w-xs">
              Confirming your credentials with Supabase. Please wait a moment...
            </Text>
          </View>
        )}

        {status === "success" && (
          <View className="items-center">
            <View className="w-16 h-16 rounded-3xl bg-[#E6F7F5] dark:bg-teal-950/40 items-center justify-center mb-5 border border-[#C6EFEA] dark:border-teal-900/40">
              <Ionicons name="checkmark-circle" size={36} color="#0D9E94" />
            </View>
            <Text className="text-xl font-bold text-[#1B2B4B] dark:text-slate-100 mb-2">
              Email Verified!
            </Text>
            <Text className="text-sm text-[#64748B] dark:text-slate-400 text-center leading-relaxed max-w-xs">
              Your account has been confirmed. Redirecting to setup...
            </Text>
          </View>
        )}

        {status === "error" && (
          <View className="items-center w-full max-w-sm">
            <View className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 items-center justify-center mb-5 border border-red-100 dark:border-red-900/40">
              <Ionicons name="alert-circle" size={36} color="#DC2626" />
            </View>
            <Text className="text-xl font-bold text-[#1B2B4B] dark:text-slate-100 mb-2">
              Verification Failed
            </Text>
            <Text className="text-sm text-red-600 dark:text-red-400 text-center mb-6 leading-relaxed">
              {errorMessage || "The confirmation link may have expired or is invalid."}
            </Text>
            <Pressable
              onPress={() => router.replace("/(auth)/login")}
              className="w-full bg-[#0D9E94] py-3.5 rounded-2xl items-center shadow-sm active:opacity-90"
            >
              <Text className="text-white font-bold text-base">Back to Login</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
