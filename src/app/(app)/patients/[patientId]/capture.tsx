import { useAssessmentsStore } from "@/features/assessments/store";
import { toast } from "@/features/notifications/toastStore";
import { useCameraPermissions } from "@/hooks/useCameraPermissions";
import {
  CameraView,
  type CameraCapturedPicture,
  type FlashMode,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CaptureScreen() {
  const { t } = useTranslation();
  const { setCapturedImageUri } = useAssessmentsStore();
  const { patientId: rawPatientId, patientid: fallbackPatientId } =
    useLocalSearchParams<{
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
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [activeTab, setActiveTab] = useState<"photo" | "guide">("photo");

  // Permission not yet determined — show loading
  if (status === "undetermined") {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-6">
          <Text className="text-4xl">📷</Text>
        </View>
        <Text className="text-white text-xl font-bold text-center mb-2">
          {t("capture:cameraRequired") || "Camera Access Required"}
        </Text>
        <Text className="text-white/60 text-sm text-center mb-8">
          {t("capture:cameraRequiredDesc") ||
            "DermSight needs camera access to capture images of skin lesions for assessment."}
        </Text>
        <Pressable
          onPress={async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            requestPermission();
          }}
          className="bg-primary px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-base">
            {t("capture:grantAccess") || "Grant Camera Access"}
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
          {t("capture:cameraDenied") || "Camera Access Denied"}
        </Text>
        <Text className="text-white/60 text-sm text-center mb-6">
          {t("capture:cameraDeniedDesc") ||
            "Please enable camera access in your device settings to capture lesion images."}
        </Text>
        <Pressable
          onPress={async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
          className="bg-white/20 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">{t("common:back")}</Text>
        </Pressable>
      </View>
    );
  }

  const openReview = (imageUri: string) => {
    setCapturedImageUri(imageUri);
    router.push({
      pathname: `/(app)/patients/${patientId}/review`,
      params: { imageUri },
    } as Href);
  };

  const handleImportFromGallery = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.error(t("capture:galleryPermission"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        exif: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        openReview(result.assets[0].uri);
      }
    } catch {
      toast.error(t("capture:galleryFailed"));
    }
  };
  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) return;

    setIsCapturing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    try {
      const photo: CameraCapturedPicture | undefined =
        await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: true,
          exif: true,
        });

      if (photo?.uri) {
        openReview(photo.uri);
      }
    } catch {
      toast.error(
        t("capture:captureFailed") || "Capture failed. Please try again.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFlash = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setFlash((prev) =>
      prev === "off" ? "on" : prev === "on" ? "auto" : "off",
    );
  };

  const toggleFacing = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleTipsToggle = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setShowTips(!showTips);
  };

  const flashActive = flash !== "off";

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black">
      {/* Live camera preview */}
      <CameraView
        ref={cameraRef}
        facing={facing}
        flash={flash}
        mode="picture"
        onCameraReady={() => setIsCameraReady(true)}
        style={StyleSheet.absoluteFill}
        enableTorch={false}
      />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 absolute top-0 left-0 right-0 z-10">
        <Pressable
          onPress={async () => {
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            router.back();
          }}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Image
            source={require("../../../../../assets/icons/capture-close.png")}
            style={{ width: 20, height: 20 }}
            contentFit="contain"
            tintColor="#FFFFFF"
          />
        </Pressable>
        <View className="flex-row gap-3">
          <Pressable
            onPress={toggleFlash}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Image
              source={require("../../../../../assets/icons/capture-light.png")}
              style={{ width: 22, height: 22 }}
              contentFit="contain"
              tintColor={flashActive ? "#0D9E94" : "#FFFFFF"}
            />
          </Pressable>
          <Pressable
            onPress={toggleFacing}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <Image
              source={require("../../../../../assets/icons/capture-camera.png")}
              style={{ width: 22, height: 22 }}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </Pressable>
        </View>
      </View>

      {/* Instruction overlay */}
      <View className="absolute top-28 left-8 right-8 bg-black/60 rounded-2xl py-3 px-4 z-10">
        <Text className="text-white text-sm text-center leading-5">
          {t("capture:positionInstruction")}
        </Text>
      </View>

      {/* Framing guide */}
      <View className="flex-1 items-center justify-center z-0">
        <View className="w-72 h-72 relative">
          <View className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-[#0D9E94] rounded-tl-2xl" />
          <View className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-[#0D9E94] rounded-tr-2xl" />
          <View className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-[#0D9E94] rounded-bl-2xl" />
          <View className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-[#0D9E94] rounded-br-2xl" />
        </View>
      </View>

      {/* Bottom controls */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/85 pb-10 pt-4 px-6 rounded-t-3xl z-10">
        {/* Tabs */}
        <View className="flex-row justify-center mb-5">
          <Pressable onPress={() => setActiveTab("photo")} className="mr-6">
            <Text
              className={`text-base font-semibold ${activeTab === "photo" ? "text-[#0D9E94]" : "text-white/60"}`}
            >
              {t("capture:photo")}
            </Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab("guide")}>
            <Text
              className={`text-base font-semibold ${activeTab === "guide" ? "text-[#0D9E94]" : "text-white/60"}`}
            >
              {t("capture:guide")}
            </Text>
          </Pressable>
        </View>

        {/* Shutter + side controls */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={handleImportFromGallery}
            className="items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-1">
              <Image
                source={require("../../../../../assets/icons/capture-gallery.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
                tintColor="#FFFFFF"
              />
            </View>
            <Text className="text-white text-xs">{t("capture:gallery")}</Text>
          </Pressable>

          {/* Shutter button */}
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="items-center justify-center"
            style={{ width: 76, height: 76 }}
          >
            <View
              className="rounded-full border-[4px] border-white items-center justify-center"
              style={{ width: 76, height: 76 }}
            >
              <View
                className={`rounded-full items-center justify-center ${isCapturing ? "bg-gray-400" : "bg-white"}`}
                style={{ width: 60, height: 60 }}
              >
                {isCapturing && (
                  <ActivityIndicator size="small" color="#0D9E94" />
                )}
              </View>
            </View>
          </Pressable>

          <Pressable onPress={handleTipsToggle} className="items-center">
            <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-1">
              <Image
                source={require("../../../../../assets/icons/capture-tips.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
                tintColor="#FFFFFF"
              />
            </View>
            <Text className="text-white text-xs">{t("capture:tips")}</Text>
          </Pressable>
        </View>

        {/* Expandable tips */}
        {showTips && (
          <View className="bg-white/10 rounded-2xl p-4">
            <View className="flex-row items-start mb-2">
              <Text className="text-white/90 text-xs mr-2">•</Text>
              <Text className="text-white/80 text-xs flex-1">
                {t("review:useNaturalLight")}
              </Text>
            </View>
            <View className="flex-row items-start mb-2">
              <Text className="text-white/90 text-xs mr-2">•</Text>
              <Text className="text-white/80 text-xs flex-1">
                {t("review:keepFocus")}
              </Text>
            </View>
            <View className="flex-row items-start mb-2">
              <Text className="text-white/90 text-xs mr-2">•</Text>
              <Text className="text-white/80 text-xs flex-1">
                {t("review:captureEntire")}
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-white/90 text-xs mr-2">•</Text>
              <Text className="text-white/80 text-xs flex-1">
                {t("capture:avoidShadows") ||
                  "Avoid shadows and glare on the skin"}
              </Text>
            </View>
          </View>
        )}

        {/* Guide card */}
        <View className="mt-4 bg-white/10 rounded-2xl p-4 flex-row items-center">
          <Image
            source={require("../../../../../assets/icons/capture-tips.png")}
            style={{ width: 28, height: 28, marginRight: 12 }}
            contentFit="contain"
            tintColor="#0D9E94"
          />
          <View className="flex-1">
            <Text className="text-white text-sm font-semibold">
              {t("capture:tipText")}
            </Text>
            <Text className="text-white/60 text-xs mt-0.5">
              {t("capture:avoidShadows") || "Avoid shadows and keep steady"}
            </Text>
          </View>
          <Text className="text-white/60 text-lg">⌄</Text>
        </View>
      </View>
    </View>
  );
}


