/**
 * Camera permissions hook.
 */

import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

interface CameraPermissionState {
  status: "granted" | "denied" | "undetermined";
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useCameraPermissions(): CameraPermissionState {
  const [status, setStatus] = useState<"granted" | "denied" | "undetermined">(
    "undetermined",
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // For web/dev, assume granted
    if (Platform.OS === "web") {
      setStatus("granted");
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In production, use react-native-vision-camera's requestCameraPermission()
      // For now, simulate granted
      setStatus("granted");
      return true;
    } catch {
      setStatus("denied");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { status, isLoading, requestPermission };
}
