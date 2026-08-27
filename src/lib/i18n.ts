/**
 * i18next initialization for multi-region health worker deployment.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../../assets/locales/en.json";
import fr from "../../assets/locales/fr.json";
import sw from "../../assets/locales/sw.json";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  sw: { translation: sw },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

export default i18n;
