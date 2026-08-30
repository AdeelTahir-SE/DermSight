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
  USER_EMAIL: "dermsight_user_email",
  REMEMBERED_EMAIL: "dermsight_remembered_email",
  REMEMBER_ME: "dermsight_remember_me",
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

export async function saveUserEmail(email: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.USER_EMAIL, email);
  } else {
    await SecureStore.setItemAsync(KEYS.USER_EMAIL, email);
  }
}

export async function getUserEmail(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.USER_EMAIL);
  } else {
    return SecureStore.getItemAsync(KEYS.USER_EMAIL);
  }
}

// ── Remember Me ─────────────────────────────────────────────────────────
export async function saveRememberedEmail(email: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.REMEMBERED_EMAIL, email);
  } else {
    await SecureStore.setItemAsync(KEYS.REMEMBERED_EMAIL, email);
  }
}

export async function getRememberedEmail(): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(KEYS.REMEMBERED_EMAIL);
  } else {
    return SecureStore.getItemAsync(KEYS.REMEMBERED_EMAIL);
  }
}

export async function deleteRememberedEmail(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(KEYS.REMEMBERED_EMAIL);
  } else {
    await SecureStore.deleteItemAsync(KEYS.REMEMBERED_EMAIL);
  }
}

export async function saveRememberMePreference(enabled: boolean): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEYS.REMEMBER_ME, enabled ? "true" : "false");
  } else {
    await SecureStore.setItemAsync(KEYS.REMEMBER_ME, enabled ? "true" : "false");
  }
}

export async function getRememberMePreference(): Promise<boolean> {
  if (isWeb) {
    const val = localStorage.getItem(KEYS.REMEMBER_ME);
    return val !== "false";
  } else {
    const val = await SecureStore.getItemAsync(KEYS.REMEMBER_ME);
    return val !== "false";
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
    localStorage.removeItem(KEYS.USER_EMAIL);
  } else {
    await Promise.all([
      deleteAuthToken(),
      deleteRefreshToken(),
      SecureStore.deleteItemAsync(KEYS.PIN_HASH),
      SecureStore.deleteItemAsync(KEYS.USER_ID),
      SecureStore.deleteItemAsync(KEYS.WORKER_NAME),
      SecureStore.deleteItemAsync(KEYS.USER_EMAIL),
    ]);
  }
}
