/**
 * Language selection screen.
 */

import i18n from "@/lib/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
];

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState(i18n.language || "en");

  const handleSelect = (code: string) => {
    setSelected(code);
    i18n.changeLanguage(code);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 mr-3">
            <Text className="text-xl">←</Text>
          </Pressable>
          <Text className="text-lg font-bold text-navy">
            {t("settings:language")}
          </Text>
        </View>
      </View>

      <View className="p-5">
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => handleSelect(lang.code)}
            className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
              selected === lang.code
                ? "border-primary bg-primary-50"
                : "border-gray-100 bg-white"
            }`}
          >
            <View className="flex-1">
              <Text
                className={`text-base font-medium ${
                  selected === lang.code ? "text-primary" : "text-navy"
                }`}
              >
                {lang.name}
              </Text>
              <Text className="text-sm text-gray-500">{lang.nativeName}</Text>
            </View>
            {selected === lang.code && (
              <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
