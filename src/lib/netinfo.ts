import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { Platform } from "react-native";

export type ConnectivityCallback = (isConnected: boolean) => void;

/**
 * Subscribe to connectivity changes.
 * Returns an unsubscribe function.
 */
export function subscribeToConnectivity(
  callback: ConnectivityCallback,
): () => void {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Provide immediate initial value
    callback(typeof navigator !== "undefined" ? navigator.onLine : true);

    const netInfoUnsub = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      callback(connected);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      netInfoUnsub();
    };
  }

  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
    callback(connected);
  });

  // Query immediate status
  NetInfo.fetch().then((state) => {
    const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
    callback(connected);
  }).catch(() => {});

  return () => unsubscribe();
}

/**
 * Get current connectivity status (synchronous from last known state).
 */
export async function isConnected(): Promise<boolean> {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return true;
  }
}

/**
 * Get current network type.
 */
export async function getNetworkType(): Promise<string> {
  try {
    const state = await NetInfo.fetch();
    return state.type || "unknown";
  } catch {
    return "unknown";
  }
}

