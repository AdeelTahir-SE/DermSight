/**
 * ConnectivityBanner — persistent offline/online indicator.
 */

import React from "react";
import { View, Text } from "react-native";
import { useConnectivity } from "@/hooks/useConnectivity";
import { usePathname } from "expo-router";

export function ConnectivityBanner() {
  const { isOffline } = useConnectivity();
  const pathname = usePathname();

  if (!isOffline || pathname === "/home" || pathname === "/") return null;

  return (
    <View className="flex-row items-center bg-amber-50 px-4 py-2 border-b border-amber-100">
      <View className="w-5 h-5 rounded-full bg-amber-200 items-center justify-center mr-2">
        <Text className="text-amber-700 text-xs">!</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-amber-800">
          You are offline
        </Text>
        <Text className="text-xs text-amber-600">
          Data will sync automatically when connection is available.
        </Text>
      </View>
    </View>
  );
}
