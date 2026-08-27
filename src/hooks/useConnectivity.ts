/**
 * Connectivity hook — monitors online/offline state.
 */

import { subscribeToConnectivity } from "@/lib/netinfo";
import { useEffect, useState } from "react";

export function useConnectivity() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToConnectivity(setIsConnected);
    return unsubscribe;
  }, []);

  return { isConnected, isOffline: isConnected === false };
}
