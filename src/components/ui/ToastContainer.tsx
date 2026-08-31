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
    bgColor: string;
    iconBgColor: string;
  }
> = {
  success: {
    icon: "checkmark-circle",
    bgColor: "bg-[#0D9E94]", // Solid primary teal
    iconBgColor: "bg-white/20",
  },
  error: {
    icon: "alert-circle",
    bgColor: "bg-[#DC2626]", // Solid error red
    iconBgColor: "bg-white/20",
  },
  warning: {
    icon: "warning",
    bgColor: "bg-[#D97706]", // Solid warning amber
    iconBgColor: "bg-white/20",
  },
  info: {
    icon: "information-circle",
    bgColor: "bg-[#0A7E76]", // Solid teal info
    iconBgColor: "bg-white/20",
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
      className={`w-full max-w-[420px] flex-row items-center px-4 py-3.5 rounded-2xl ${theme.bgColor} shadow-lg shadow-black/25`}
      style={{
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      }}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${theme.iconBgColor}`}
      >
        <Ionicons name={theme.icon} size={20} color="#FFFFFF" />
      </View>

      <Text className="flex-1 text-[14px] font-semibold text-white leading-snug">
        {item.message}
      </Text>

      <Pressable
        onPress={() => hideToast(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className="p-1.5 ml-2 rounded-full active:bg-white/20"
      >
        <Ionicons name="close" size={16} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

