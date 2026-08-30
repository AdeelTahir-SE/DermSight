/**
 * Lesion Capture (Camera) screen — live camera with photo capture.
 * Uses expo-camera CameraView for real-time preview and capture.
 */

import { useCameraPermissions } from "@/hooks/useCameraPermissions";
import {
    CameraView,
    type CameraCapturedPicture,
    type FlashMode,
} from "expo-camera";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import { useAssessmentsStore } from "@/features/assessments/store";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function CaptureScreen() {
  const { setCapturedImageUri } = useAssessmentsStore();
  const {
    patientId: rawPatientId,
    patientid: fallbackPatientId,
  } = useLocalSearchParams<{
    patientId?: string;
    patientid?: string;
  }>();
  const patientId = rawPatientId || fallbackPatientId || "";
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const { status, requestPermission } = useCameraPermissions();

  const [flash, setFlash] = useState<FlashMode>("off");
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Permission not yet determined — show loading
  if (status === "undetermined") {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-6">
          <Text className="text-4xl">📷</Text>
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">
          Camera Access Required
        </Text>
        <Text className="text-white/60 text-sm text-center mb-8">
          DermSight needs camera access to capture images of skin lesions for
          assessment.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-base">
            Grant Camera Access
          </Text>
        </Pressable>
      </View>
    );
  }

  // Permission denied
  if (status === "denied") {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text className="text-5xl mb-4">🚫</Text>
        <Text className="text-white text-xl font-bold text-center mb-2">
          Camera Access Denied
        </Text>
        <Text className="text-white/60 text-sm text-center mb-6">
          Please enable camera access in your device settings to capture lesion
          images.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-white/20 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo: CameraCapturedPicture | undefined =
        await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
          exif: true,
        });

      if (photo?.uri) {
        setCapturedImageUri(photo.uri);
        router.push({
          pathname: `/(app)/patients/${patientId}/review`,
          params: { imageUri: photo.uri },
        } as Href);
      }
    } catch (error) {
      console.error("Capture failed:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFlash = () => {
    setFlash((prev) =>
      prev === "off" ? "on" : prev === "on" ? "auto" : "off",
    );
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const flashIcon = flash === "off" ? "⚡" : flash === "on" ? "⚡" : "🔄";
  const flashLabel = flash.toUpperCase();

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black">
      {/* Live camera preview */}
      <CameraView
        ref={cameraRef}
        facing={facing}
        flash={flash}
        style={StyleSheet.absoluteFill}
        enableTorch={false}
      />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 absolute top-0 left-0 right-0 z-10">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Text className="text-white text-xl">✕</Text>
        </Pressable>
        <Pressable
          onPress={toggleFlash}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Text className="text-white text-lg">{flashIcon}</Text>
        </Pressable>
        <Pressable
          onPress={toggleFacing}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Text className="text-white text-lg">🔄</Text>
        </Pressable>
      </View>

      {/* Instruction overlay */}
      <View className="absolute top-24 left-5 right-5 bg-black/50 rounded-xl p-3 z-10">
        <Text className="text-white text-sm text-center">
          Position the lesion within the frame and ensure good lighting.
        </Text>
      </View>

      {/* Framing guide */}
      <View className="flex-1 items-center justify-center z-0">
        <View className="w-64 h-64 relative">
          {/* Corner brackets */}
          <View className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#0D9E94] rounded-tl-lg" />
          <View className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#0D9E94] rounded-tr-lg" />
          <View className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#0D9E94] rounded-bl-lg" />
          <View className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#0D9E94] rounded-br-lg" />

          {/* Center crosshair */}
          <View className="absolute top-1/2 left-1/2 -ml-4 -mt-0.5 w-8 h-1 bg-[#0D9E94]/50 rounded" />
          <View className="absolute top-1/2 left-1/2 -ml-0.5 -mt-4 h-8 w-1 bg-[#0D9E94]/50 rounded" />
        </View>
      </View>

      {/* Bottom controls */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/80 pb-12 pt-4 px-5 rounded-t-3xl z-10">
        {/* Flash indicator */}
        <View className="flex-row justify-center mb-2">
          <View className="bg-black/40 rounded-full px-3 py-1">
            <Text className="text-white/70 text-xs font-medium">
              Flash: {flashLabel}
            </Text>
          </View>
        </View>

        {/* Shutter + side controls */}
        <View className="flex-row items-center justify-around">
          {/* Gallery placeholder */}
          <Pressable className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center">
            <Text className="text-white text-xl">🖼️</Text>
          </Pressable>

          {/* Shutter button */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="items-center justify-center"
            style={{ width: 72, height: 72 }}
          >
            <View
              className="rounded-full border-4 border-white items-center justify-center"
              style={{ width: 72, height: 72 }}
            >
              <View
                className={`rounded-full ${isCapturing ? "bg-gray-400" : "bg-white"}`}
                style={{ width: 56, height: 56 }}
              >
                {isCapturing && (
                  <ActivityIndicator
                    size="small"
                    color="#0D9E94"
                    className="mt-4"
                  />
                )}
              </View>
            </View>
          </Pressable>

          {/* Tips toggle */}
          <Pressable
            onPress={() => setShowTips(!showTips)}
            className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center"
          >
            <Text className="text-white text-xl">💡</Text>
          </Pressable>
        </View>

        {/* Expandable tips */}
        {showTips && (
          <View className="mt-4 bg-white/10 rounded-xl p-3 gap-1">
            <Text className="text-white/80 text-xs">
              ☀️ Use natural light when possible
            </Text>
            <Text className="text-white/80 text-xs">
              🎯 Keep the lesion centered and in focus
            </Text>
            <Text className="text-white/80 text-xs">
              📐 Capture the entire lesion with some surrounding skin
            </Text>
            <Text className="text-white/80 text-xs">
              🚫 Avoid shadows and glare on the skin
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
