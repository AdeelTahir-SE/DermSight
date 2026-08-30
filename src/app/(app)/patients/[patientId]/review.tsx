import { runInference } from "@/features/assessments/inference/classify";
import { useAssessmentsStore } from "@/features/assessments/store";
import { toast } from "@/features/notifications/toastStore";
import { useThemeStore } from "@/features/theme/store";
import { normalizeImageUri } from "@/utils/image";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

const ICON_COLOR = "#0D9E94";
const ICON_COLOR_DARK = "#2DD4BF";

export default function ReviewScreen() {
  const { capturedImageUri } = useAssessmentsStore();
  const {
    patientId: rawPatientId,
    patientid: fallbackPatientId,
    imageUri,
  } = useLocalSearchParams<{
    patientId?: string;
    patientid?: string;
    imageUri?: string;
  }>();
  const patientId = rawPatientId || fallbackPatientId || "";
  const rawUri = capturedImageUri || imageUri || "";
  const activeImageUri = normalizeImageUri(rawUri);
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const [analyzing, setAnalyzing] = useState(false);
  const [fileStats, setFileStats] = useState<{
    exists: boolean;
    size?: number;
  } | null>(null);

  useEffect(() => {
    console.log("[ReviewScreen] activeImageUri:", activeImageUri);
    if (activeImageUri && Platform.OS !== "web") {
      FileSystem.getInfoAsync(activeImageUri)
        .then((info) => {
          console.log("[ReviewScreen] File info:", info);
          setFileStats(info);
        })
        .catch((e) => console.error("[ReviewScreen] getInfoAsync error:", e));
    }
  }, [activeImageUri]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await runInference(activeImageUri || "captured_image");
      toast.success("Analysis complete!");

      router.push({
        pathname: `/(app)/patients/${patientId}/result`,
        params: {
          result: JSON.stringify(result),
          imageUri: activeImageUri,
        },
      } as Href);
    } catch (e) {
      console.error("Analysis failed:", e);
      toast.error("Analysis failed. Please retake the photo.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetake = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    router.back();
  };

  const handleDelete = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    toast.info("Image discarded.");
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-white dark:bg-slate-900">
        <Pressable onPress={handleRetake} className="p-1">
          <Image
            source={require("../../../../../assets/icons/profile-back.png")}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
            tintColor={isDark ? "#E2E8F0" : "#1B2B4B"}
          />
        </Pressable>
        <Text className="text-lg font-bold text-navy dark:text-slate-100">
          Review Image
        </Text>
        <Pressable onPress={handleDelete} className="flex-row items-center p-1">
          <Image
            source={require("../../../../../assets/icons/review-delete.png")}
            style={{ width: 18, height: 18, marginRight: 4 }}
            contentFit="contain"
            tintColor="#EF4444"
          />
          <Text className="text-sm font-semibold text-red-500">Delete</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-white dark:bg-slate-950"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5">
          <Text className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Check the image quality before analysis
          </Text>

          {/* Captured image preview */}
          <View className="w-full aspect-square bg-gray-100 dark:bg-slate-900 rounded-2xl mb-5 overflow-hidden border border-gray-200 dark:border-slate-800 justify-center items-center">
            {activeImageUri ? (
              <Image
                source={{ uri: activeImageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                onError={(err) =>
                  console.error(
                    "[ReviewScreen] Image load error:",
                    err.error,
                    err,
                  )
                }
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <View className="w-32 h-32 rounded-full bg-amber-200 dark:bg-amber-950/20 items-center justify-center">
                  <Text className="text-4xl">🔬</Text>
                </View>
                <Text className="text-gray-400 dark:text-slate-500 text-sm mt-3">
                  Captured Lesion Image
                </Text>
              </View>
            )}
          </View>

          {fileStats && !fileStats.exists && (
            <View className="bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl mb-4 border border-red-150/30 dark:border-red-900/30">
              <Text className="text-xs text-red-650 dark:text-red-400 leading-relaxed">
                Warning: Captured image file does not exist on disk. Please
                retake.
              </Text>
            </View>
          )}

          {/* Quality indicator */}
          <View className="flex-row items-center bg-[#F0FDFA] dark:bg-teal-950/20 border border-[#CCFBF1] dark:border-teal-900/30 rounded-2xl p-4 mb-5">
            <Image
              source={require("../../../../../assets/icons/review-quality.png")}
              style={{ width: 24, height: 24, marginRight: 12 }}
              contentFit="contain"
              tintColor={isDark ? ICON_COLOR_DARK : ICON_COLOR}
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-[#0D9488] dark:text-teal-300">
                Image Quality: Good
              </Text>
              <Text className="text-xs text-[#14B8A6] dark:text-teal-400 mt-0.5">
                The image is clear and suitable for analysis.
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-2xl p-4 mb-6">
            <Text className="text-sm font-semibold text-navy dark:text-slate-100 mb-3">
              Tips for better results
            </Text>
            <TipRow
              icon={require("../../../../../assets/icons/review-natural-light.png")}
              text="Use natural light"
              isDark={isDark}
            />
            <TipRow
              icon={require("../../../../../assets/icons/review-lesion.png")}
              text="Keep the lesion in focus"
              isDark={isDark}
            />
            <TipRow
              icon={require("../../../../../assets/icons/review-entire-lesion.png")}
              text="Capture the entire lesion"
              isDark={isDark}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View className="px-5 pb-10 pt-2 gap-3 bg-white dark:bg-slate-950">
        <Pressable
          onPress={handleAnalyze}
          disabled={analyzing}
          className={`flex-row items-center justify-center rounded-xl py-4 ${analyzing ? "bg-primary/70" : "bg-primary"}`}
        >
          <Text className="text-white font-semibold text-base mr-2">
            {analyzing ? "Analyzing Image..." : "Use Image & Analyze"}
          </Text>
          {!analyzing && <Text className="text-white text-lg">→</Text>}
          {analyzing && <View className="w-5 h-5" />}
        </Pressable>

        <Pressable
          onPress={handleRetake}
          disabled={analyzing}
          className="flex-row items-center justify-center rounded-xl py-4 border border-primary bg-white dark:bg-slate-900"
        >
          <Image
            source={require("../../../../../assets/icons/review-retake.png")}
            style={{ width: 20, height: 20, marginRight: 8 }}
            contentFit="contain"
            tintColor="#0D9E94"
          />
          <Text className="text-primary dark:text-primary-400 font-semibold text-base">
            Retake Photo
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function TipRow({
  icon,
  text,
  isDark,
}: {
  icon: any;
  text: string;
  isDark: boolean;
}) {
  return (
    <View className="flex-row items-center py-2">
      <Image
        source={icon}
        style={{ width: 20, height: 20, marginRight: 12 }}
        contentFit="contain"
        tintColor={isDark ? "#94A3B8" : "#64748B"}
      />
      <Text className="text-sm text-gray-600 dark:text-slate-400 font-medium">
        {text}
      </Text>
    </View>
  );
}
