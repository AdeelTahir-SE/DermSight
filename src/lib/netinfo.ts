/**
 * NetInfo connectivity listener wrapper.
 */

import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export type ConnectivityCallback = (isConnected: boolean) => void;

let currentIsConnected: boolean | null = null;

/**
 * Subscribe to connectivity changes.
 * Returns an unsubscribe function.
 */
export function subscribeToConnectivity(
  callback: ConnectivityCallback,
): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;
    if (isConnected !== currentIsConnected) {
      currentIsConnected = isConnected;
      callback(isConnected);
    }
  });
  return () => unsubscribe();
}

/**
 * Get current connectivity status (synchronous from last known state).
 */
export async function isConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Get current network type.
 */
export async function getNetworkType(): Promise<string> {
  const state = await NetInfo.fetch();
  return state.type;
}
