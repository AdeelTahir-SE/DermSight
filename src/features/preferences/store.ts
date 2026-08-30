/**
 * App preferences store — sync notifications, measurement units and
 * last successful sync timestamp, persisted across sessions.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type UnitsType = "metric" | "imperial";

interface PreferencesState {
  notificationsEnabled: boolean;
  units: UnitsType;
  lastSyncedAt: string | null;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setUnits: (units: UnitsType) => Promise<void>;
  setLastSyncedAt: (iso: string) => Promise<void>;
  initializePreferences: () => Promise<void>;
}

const PREFS_KEY = "dermsight_preferences";
const isWeb = Platform.OS === "web";

interface PersistedPrefs {
  notificationsEnabled: boolean;
  units: UnitsType;
  lastSyncedAt: string | null;
}

async function savePrefs(prefs: PersistedPrefs): Promise<void> {
  const value = JSON.stringify(prefs);
  try {
    if (isWeb) {
      localStorage.setItem(PREFS_KEY, value);
    } else {
      await SecureStore.setItemAsync(PREFS_KEY, value);
    }
  } catch {
    // Persistence failure is non-fatal — preferences still apply this session.
  }
}

async function loadPrefs(): Promise<PersistedPrefs | null> {
  try {
    const value = isWeb
      ? localStorage.getItem(PREFS_KEY)
      : await SecureStore.getItemAsync(PREFS_KEY);
    return value ? (JSON.parse(value) as PersistedPrefs) : null;
  } catch {
    return null;
  }
}

function currentPrefs(state: PreferencesState): PersistedPrefs {
  return {
    notificationsEnabled: state.notificationsEnabled,
    units: state.units,
    lastSyncedAt: state.lastSyncedAt,
  };
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  notificationsEnabled: true,
  units: "metric",
  lastSyncedAt: null,

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    await savePrefs(currentPrefs(get()));
  },

  setUnits: async (units: UnitsType) => {
    set({ units });
    await savePrefs(currentPrefs(get()));
  },

  setLastSyncedAt: async (iso: string) => {
    set({ lastSyncedAt: iso });
    await savePrefs(currentPrefs(get()));
  },

  initializePreferences: async () => {
    const saved = await loadPrefs();
    if (saved) {
      set({
        notificationsEnabled: saved.notificationsEnabled ?? true,
        units: saved.units ?? "metric",
        lastSyncedAt: saved.lastSyncedAt ?? null,
      });
    }
  },
}));
