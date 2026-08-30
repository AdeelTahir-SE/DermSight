/**
 * Image Review / Retake screen — confirm or retake before running inference.
 * Displays the captured photo from expo-camera for quality check.
 */

import { Button } from "@/components/ui/Button";
import { runInference } from "@/features/assessments/inference/classify";
import { useAssessmentsStore } from "@/features/assessments/store";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

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
  const activeImageUri = capturedImageUri || imageUri || "";
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

      router.push({
        pathname: `/(app)/patients/${patientId}/result`,
        params: {
          result: JSON.stringify(result),
          imageUri: activeImageUri,
        },
      } as Href);
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-1">
          <Text className="text-xl">←</Text>
        </Pressable>
        <Text className="text-lg font-bold text-navy">Review Image</Text>
        <Pressable onPress={() => router.back()} className="p-1">
          <Text className="text-lg text-red-500">🗑️</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <Text className="text-base font-semibold text-navy mb-1">
            Review Image
          </Text>
          <Text className="text-sm text-gray-500 mb-4">
            Check the image quality before analysis.
          </Text>

          {/* Captured image preview */}
          <View className="w-full aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden border border-gray-200 justify-center items-center">
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
                <View className="w-32 h-32 rounded-full bg-amber-200 items-center justify-center">
                  <Text className="text-4xl">🔬</Text>
                </View>
                <Text className="text-gray-400 text-sm mt-3">
                  Captured Lesion Image
                </Text>
              </View>
            )}
          </View>

          {fileStats && !fileStats.exists && (
            <View className="bg-red-50 p-2 rounded-lg mb-3">
              <Text className="text-xs text-red-600">
                Warning: Captured image file does not exist on disk.
              </Text>
            </View>
          )}

          {/* Quality indicator */}
          <View className="flex-row items-center bg-green-50 rounded-xl p-3 mb-4">
            <Text className="text-lg mr-2">🛡️</Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-green-800">
                Image Quality: Good
              </Text>
              <Text className="text-xs text-green-600">
                The image is clear and suitable for analysis.
              </Text>
            </View>
          </View>

          {/* Tips */}
          <Text className="text-sm font-semibold text-navy mb-3">
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
      <View className="px-5 pb-10 gap-3">
        {analyzing ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color="#0D9E94" />
            <Text className="text-sm text-gray-500 mt-3">
              Analyzing image...
            </Text>
          </View>
        ) : (
          <>
            <Button
              title="Use Image & Analyze"
              onPress={handleAnalyze}
              iconRight={<Text className="text-white ml-2">→</Text>}
            />
            <Button
              title="Retake Photo"
              onPress={() => router.back()}
              variant="outline"
              icon={<Text className="mr-2">📷</Text>}
            />
          </>
        )}
      </View>
    </View>
  );
}

function TipRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center bg-gray-50 rounded-xl p-3">
      <Text className="text-lg mr-3">{icon}</Text>
      <Text className="text-sm text-gray-600">{text}</Text>
    </View>
  );
}
