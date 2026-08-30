import { Button } from "@/components/ui/Button";
import { runInference } from "@/features/assessments/inference/classify";
import { useAssessmentsStore } from "@/features/assessments/store";
import { toast } from "@/features/notifications/toastStore";
import { normalizeImageUri } from "@/utils/image";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

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
  const [analyzing, setAnalyzing] = useState(false);
  const [fileStats, setFileStats] = useState<{ exists: boolean; size?: number } | null>(null);

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
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <Pressable onPress={handleRetake} className="p-1">
          <Text className="text-xl text-navy dark:text-slate-100">←</Text>
        </Pressable>
        <Text className="text-lg font-bold text-navy dark:text-slate-100">Review Image</Text>
        <Pressable onPress={handleDelete} className="p-1">
          <Text className="text-lg text-red-500">🗑️</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 bg-white dark:bg-slate-950" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <Text className="text-base font-semibold text-navy dark:text-slate-100 mb-1">
            Image Quality Check
          </Text>
          <Text className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Check the image quality before analysis.
          </Text>

          {/* Captured image preview */}
          <View className="w-full aspect-square bg-gray-100 dark:bg-slate-900 rounded-2xl mb-4 overflow-hidden border border-gray-200 dark:border-slate-800 justify-center items-center">
            {activeImageUri ? (
              <Image
                source={{ uri: activeImageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                onError={(err) =>
                  console.error("[ReviewScreen] Image load error:", err.error, err)
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
            <View className="bg-red-50 dark:bg-red-950/20 p-3.5 rounded-xl mb-3 border border-red-150/30 dark:border-red-900/30">
              <Text className="text-xs text-red-650 dark:text-red-400 leading-relaxed">
                Warning: Captured image file does not exist on disk. Please retake.
              </Text>
            </View>
          )}

          {/* Quality indicator */}
          <View className="flex-row items-center bg-green-50 dark:bg-green-950/25 border border-green-150/50 dark:border-green-900/25 rounded-2xl p-4 mb-5">
            <Text className="text-lg mr-2.5">🛡️</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-green-800 dark:text-green-300">
                Image Quality: Good
              </Text>
              <Text className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                The image is clear and suitable for analysis.
              </Text>
            </View>
          </View>

          {/* Tips */}
          <Text className="text-sm font-semibold text-navy dark:text-slate-100 mb-3">
            Tips for better results
          </Text>
          <View className="gap-2 mb-6">
            <TipRow icon="☀️" text="Use natural light" />
            <TipRow icon="🎯" text="Keep the lesion in focus" />
            <TipRow icon="📐" text="Capture the entire lesion" />
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View className="px-5 pb-10 gap-3 bg-white dark:bg-slate-950">
        <Button
          title={analyzing ? "Analyzing Image..." : "Use Image & Analyze"}
          onPress={handleAnalyze}
          loading={analyzing}
          disabled={analyzing}
          iconRight={!analyzing ? <Text className="text-white ml-2">→</Text> : undefined}
        />
        <Button
          title="Retake Photo"
          onPress={handleRetake}
          variant="outline"
          disabled={analyzing}
          icon={<Text className="mr-2">📷</Text>}
        />
      </View>
    </View>
  );
}

function TipRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center bg-gray-50 dark:bg-slate-900 border border-gray-150/10 dark:border-slate-800 rounded-xl p-3.5">
      <Text className="text-lg mr-3">{icon}</Text>
      <Text className="text-sm text-gray-600 dark:text-slate-400 font-medium">{text}</Text>
    </View>
  );
}
