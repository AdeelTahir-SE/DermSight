import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useToastStore, type ToastItem } from "@/features/notifications/toastStore";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <View
      className="absolute top-12 left-4 right-4 z-[9999] gap-2 pointer-events-box-none"
      style={{ elevation: 99, shadowOpacity: 0 }}
    >
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

function ToastRow({ item }: { item: ToastItem }) {
  const hideToast = useToastStore((state) => state.hideToast);

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
      } catch (err) {
        // Safe check for web or simulated environments
      }
    }
    triggerHaptic();
  }, [item.type]);

  const typeConfig = {
    success: {
      bg: "bg-green-50 dark:bg-green-950/95",
      border: "border-green-100 dark:border-green-900/50",
      text: "text-green-800 dark:text-green-200",
      icon: "✅",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/95",
      border: "border-red-100 dark:border-red-900/50",
      text: "text-red-800 dark:text-red-200",
      icon: "❌",
    },
    warning: {
      bg: "bg-orange-50 dark:bg-orange-950/95",
      border: "border-orange-100 dark:border-orange-900/50",
      text: "text-orange-800 dark:text-orange-200",
      icon: "⚠️",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/95",
      border: "border-blue-100 dark:border-blue-900/50",
      text: "text-blue-800 dark:text-blue-200",
      icon: "ℹ️",
    },
  };

  const config = typeConfig[item.type];

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(200)}
      className={`flex-row items-center border p-4 rounded-2xl shadow-lg ${config.bg} ${config.border}`}
    >
      <Text className="text-lg mr-3">{config.icon}</Text>
      <Text className={`flex-1 text-sm font-medium ${config.text}`}>
        {item.message}
      </Text>
      <Pressable onPress={() => hideToast(item.id)} className="p-1 ml-2">
        <Text className="text-xs text-gray-400 dark:text-gray-500 font-bold">✕</Text>
      </Pressable>
    </Animated.View>
  );
}
