/**
 * i18next initialization for multi-region health worker deployment.
 * Each top-level key of the locale JSON is registered as a namespace so
 * keys like "home:pendingSync" resolve correctly.
 */

import * as SecureStore from "expo-secure-store";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Platform } from "react-native";

import en from "../../assets/locales/en.json";
import fr from "../../assets/locales/fr.json";
import sw from "../../assets/locales/sw.json";

const LANGUAGE_KEY = "dermsight_language";
const isWeb = Platform.OS === "web";

const resources = { en, fr, sw };

i18n.use(initReactI18next).init({
  resources,
  ns: Object.keys(en),
  defaultNS: "common",
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

/**
 * Change the app language and persist the choice.
 */
export async function setAppLanguage(code: string): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    if (isWeb) {
      localStorage.setItem(LANGUAGE_KEY, code);
    } else {
      await SecureStore.setItemAsync(LANGUAGE_KEY, code);
    }
  } catch {
    // Persistence failure is non-fatal — language still applies this session.
  }
}

/**
 * Restore the persisted language at app bootstrap.
 */
export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = isWeb
      ? localStorage.getItem(LANGUAGE_KEY)
      : await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (saved && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // Fall back to default language.
  }
}

export default i18n;
