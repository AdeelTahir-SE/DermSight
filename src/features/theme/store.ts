import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Appearance, Platform } from "react-native";

export type ThemeType = "light" | "dark" | "system";

interface ThemeState {
  theme: ThemeType;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeType) => Promise<void>;
  initializeTheme: () => Promise<void>;
}

const THEME_KEY = "dermsight_theme_preference";
const isWeb = Platform.OS === "web";

async function saveTheme(theme: ThemeType): Promise<void> {
  if (isWeb) {
    localStorage.setItem(THEME_KEY, theme);
  } else {
    await SecureStore.setItemAsync(THEME_KEY, theme);
  }
}

async function getTheme(): Promise<ThemeType> {
  let value: string | null = null;
  if (isWeb) {
    value = localStorage.getItem(THEME_KEY);
  } else {
    value = await SecureStore.getItemAsync(THEME_KEY);
  }
  return (value as ThemeType) || "system";
}

function resolveTheme(theme: ThemeType): "light" | "dark" {
  if (theme === "system") {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
  return theme;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  resolvedTheme: resolveTheme("system"),

  setTheme: async (theme: ThemeType) => {
    await saveTheme(theme);
    const resolved = resolveTheme(theme);
    set({ theme, resolvedTheme: resolved });
  },

  initializeTheme: async () => {
    const theme = await getTheme();
    const resolved = resolveTheme(theme);
    set({ theme, resolvedTheme: resolved });
  },
}));

// Listen to system changes for dynamic theme syncing if 'system' is selected
Appearance.addChangeListener(({ colorScheme }) => {
  const currentTheme = useThemeStore.getState().theme;
  if (currentTheme === "system") {
    useThemeStore.setState({
      resolvedTheme: colorScheme === "dark" ? "dark" : "light",
    });
  }
});
