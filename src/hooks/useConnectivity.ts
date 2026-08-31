/**
 * Connectivity hook — monitors online/offline state in real-time.
 */

import { isConnected as fetchIsConnected, subscribeToConnectivity } from "@/lib/netinfo";
import { useEffect, useState } from "react";

export function useConnectivity() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    let mounted = true;

    // Fetch initial status immediately
    fetchIsConnected()
      .then((status) => {
        if (mounted) {
          setIsConnected(status);
        }
      })
      .catch(() => {});

    // Listen to real-time connectivity changes
    const unsubscribe = subscribeToConnectivity((status) => {
      if (mounted) {
        setIsConnected(status);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { isConnected, isOffline: isConnected === false };
}

