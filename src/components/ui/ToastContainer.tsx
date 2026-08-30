import React, { useEffect } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore, type ToastItem, type ToastType } from "@/features/notifications/toastStore";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute left-4 right-4 z-[9999] gap-2.5 pointer-events-box-none items-center"
      style={{
        top: Math.max(insets.top + (Platform.OS === "ios" ? 8 : 14), 24),
        elevation: 999,
        zIndex: 9999,
      }}
    >
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const TOAST_THEMES: Record<
  ToastType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    accentBorder: string;
  }
> = {
  success: {
    icon: "checkmark-circle",
    iconColor: "#0D9E94", // DermSight primary teal
    iconBg: "bg-primary-50 dark:bg-primary-950/60",
    accentBorder: "border-primary-500/30 dark:border-primary-500/40",
  },
  error: {
    icon: "alert-circle",
    iconColor: "#EF4444",
    iconBg: "bg-red-50 dark:bg-red-950/60",
    accentBorder: "border-red-400/30 dark:border-red-500/40",
  },
  warning: {
    icon: "warning",
    iconColor: "#F59E0B",
    iconBg: "bg-amber-50 dark:bg-amber-950/60",
    accentBorder: "border-amber-400/30 dark:border-amber-500/40",
  },
  info: {
    icon: "information-circle",
    iconColor: "#0D9E94",
    iconBg: "bg-primary-50 dark:bg-primary-950/60",
    accentBorder: "border-primary-500/30 dark:border-primary-500/40",
  },
};

function ToastRow({ item }: { item: ToastItem }) {
  const hideToast = useToastStore((state) => state.hideToast);
  const theme = TOAST_THEMES[item.type] || TOAST_THEMES.info;

  useEffect(() => {
    async function triggerHaptic() {
      try {
        if (item.type === "success") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (item.type === "error") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (item.type === "warning") {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch {}
    }
    triggerHaptic();
  }, [item.type]);

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(18).stiffness(180)}
      exiting={FadeOutUp.duration(200)}
      className={`w-full max-w-[420px] flex-row items-center px-3.5 py-3 rounded-2xl bg-white dark:bg-slate-900 border ${theme.accentBorder} shadow-lg shadow-black/10`}
      style={{
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      }}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${theme.iconBg}`}
      >
        <Ionicons name={theme.icon} size={20} color={theme.iconColor} />
      </View>

      <Text className="flex-1 text-sm font-medium text-navy dark:text-slate-100 leading-snug">
        {item.message}
      </Text>

      <Pressable
        onPress={() => hideToast(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="p-1 ml-2 rounded-full active:bg-gray-100 dark:active:bg-slate-800"
      >
        <Ionicons name="close" size={16} color="#94A3B8" />
      </Pressable>
    </Animated.View>
  );
}
