/**
 * expo-secure-store wrapper for auth tokens and PIN hash.
 * Never stores sensitive data in SQLite.
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEYS = {
  AUTH_TOKEN: "dermsight_auth_token",
  REFRESH_TOKEN: "dermsight_refresh_token",
  PIN_HASH: "dermsight_pin_hash",
  USER_ID: "dermsight_user_id",
  WORKER_NAME: "dermsight_worker_name",
} as const;

const isWeb = Platform.OS === "web";

// ── Auth Token ──────────────────────────────────────────────────────────
export async function saveAuthToken(token: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.AUTH_TOKEN, token);
  } else {
    await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token);
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.AUTH_TOKEN);
  } else {
    return SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
  }
}

export async function deleteAuthToken(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(KEYS.AUTH_TOKEN);
  } else {
    await SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN);
  }
}

// ── Refresh Token ───────────────────────────────────────────────────────
export async function saveRefreshToken(token: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.REFRESH_TOKEN, token);
  } else {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  } else {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  }
}

export async function deleteRefreshToken(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
  } else {
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  }
}

// ── PIN Hash ────────────────────────────────────────────────────────────
export async function savePinHash(hash: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.PIN_HASH, hash);
  } else {
    await SecureStore.setItemAsync(KEYS.PIN_HASH, hash);
  }
}

export async function getPinHash(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.PIN_HASH);
  } else {
    return SecureStore.getItemAsync(KEYS.PIN_HASH);
  }
}

// ── User Info ───────────────────────────────────────────────────────────
export async function saveUserId(id: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.USER_ID, id);
  } else {
    await SecureStore.setItemAsync(KEYS.USER_ID, id);
  }
}

export async function getUserId(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.USER_ID);
  } else {
    return SecureStore.getItemAsync(KEYS.USER_ID);
  }
}

export async function saveWorkerName(name: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.WORKER_NAME, name);
  } else {
    await SecureStore.setItemAsync(KEYS.WORKER_NAME, name);
  }
}

export async function getWorkerName(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.WORKER_NAME);
  } else {
    return SecureStore.getItemAsync(KEYS.WORKER_NAME);
  }
}

// ── Clear All ───────────────────────────────────────────────────────────
export async function clearAllSecureData(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(KEYS.AUTH_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.PIN_HASH);
    localStorage.removeItem(KEYS.USER_ID);
    localStorage.removeItem(KEYS.WORKER_NAME);
  } else {
    await Promise.all([
      deleteAuthToken(),
      deleteRefreshToken(),
      SecureStore.deleteItemAsync(KEYS.PIN_HASH),
      SecureStore.deleteItemAsync(KEYS.USER_ID),
      SecureStore.deleteItemAsync(KEYS.WORKER_NAME),
    ]);
  }
}
