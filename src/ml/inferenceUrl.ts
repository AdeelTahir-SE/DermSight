/**
 * Resolve the H-CBM inference server URL.
 * In Expo Go, hostUri is the machine running Metro — the Python server
 * listens on the same host, port 8765.
 */

import Constants from "expo-constants";

const PORT = 8765;

export function getInferenceBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_INFERENCE_URL?.replace(/\/$/, "");
  if (override) return override;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.linkingUri ??
    "";
  const host = hostUri
    .replace(/^[a-zA-Z]+:\/\//, "")
    .split("/")[0]
    .split(":")[0];

  if (host && host !== "exp.host") {
    return `http://${host}:${PORT}`;
  }

  return `http://127.0.0.1:${PORT}`;
}
