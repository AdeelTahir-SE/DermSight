/**
 * Connectivity hook — monitors online/offline state.
 */

import { subscribeToConnectivity } from "@/lib/netinfo";
import { useEffect, useState } from "react";

export function useConnectivity() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // Resolve initial status asynchronously
    import("@/lib/netinfo").then(async ({ isConnected: fetchIsConnected }) => {
      try {
        const initial = await fetchIsConnected();
        setIsConnected(initial);
      } catch (e) {
        console.warn("Failed to fetch initial connectivity:", e);
      }
    });

    const unsubscribe = subscribeToConnectivity(setIsConnected);
    return unsubscribe;
  }, []);

  return { isConnected, isOffline: isConnected === false };
}
