/**
 * Camera permissions hook — wraps expo-camera's useCameraPermissions.
 */

import { useCameraPermissions as useExpoCameraPermissions } from "expo-camera";
import { Platform } from "react-native";

interface CameraPermissionState {
  status: "granted" | "denied" | "undetermined";
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useCameraPermissions(): CameraPermissionState {
  const [permission, requestPermission] = useExpoCameraPermissions();

  if (Platform.OS === "web") {
    return {
      status: "granted",
      isLoading: false,
      requestPermission: async () => true,
    };
  }

  return {
    status: permission?.granted
      ? "granted"
      : permission?.canAskAgain
        ? "undetermined"
        : "denied",
    isLoading: !permission,
    requestPermission: async () => {
      const result = await requestPermission();
      return result.granted;
    },
  };
}
