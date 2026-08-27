/**
 * Splash / Bootstrap screen.
 * Checks auth state + DB init + model presence, routes accordingly.
 * Also serves as the onboarding flow (3 screens).
 */

import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  ImageSourcePropType,
  ScrollView,
  Text,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, pinSet, isInitialized } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isInitialized) return;

    // Auto-redirect after brief splash display
    if (isAuthenticated) {
      router.replace("/(app)/home");
    } else if (pinSet) {
      router.replace("/(auth)/login");
    }
  }, [isInitialized, isAuthenticated, pinSet]);

  const handleGetStarted = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Last onboarding slide — go to login or pin setup
      if (pinSet) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(auth)/pin-setup");
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const slide = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
          );
          setCurrentSlide(slide);
        }}
      >
        {/* Slide 1: Welcome */}
        <View
          className="w-full items-center justify-center px-8"
          style={{ width: SCREEN_WIDTH }}
        >
          <View className="flex-1 items-center justify-center">
            {/* Logo */}
            <View className="w-32 h-32 rounded-3xl bg-primary-50 items-center justify-center mb-8">
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 80, height: 80 }}
                contentFit="contain"
              />
            </View>

            <Text className="text-4xl font-bold text-center mb-2">
              <Text className="text-navy">Derm</Text>
              <Text className="text-primary">Sight</Text>
            </Text>

            <Text className="text-lg font-semibold text-navy text-center mb-2">
              AI-Powered Skin Cancer Screening
            </Text>

            <Text className="text-sm text-gray-500 text-center px-4">
              Offline. Private. Explainable.{"\n"}Built for community health
              workers.
            </Text>
          </View>
        </View>

        {/* Slide 2: Features */}
        <View className="px-8 justify-center" style={{ width: SCREEN_WIDTH }}>
          <View className="flex-1 justify-center">
            <Text className="text-2xl font-bold text-center mb-2">
              <Text className="text-navy">Smart Screening, </Text>
              <Text className="text-primary">Better Outcomes</Text>
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-8">
              DermSight helps you screen, assess and refer with confidence.
            </Text>

            {/* Feature cards */}
            <FeatureCard
              icon={require("../../assets/icons/ai-chip.png")}
              title="AI-Powered Assessment"
              description="On-device AI analyzes skin lesions and provides risk level with ABCD scores and insights."
            />
            <FeatureCard
              icon={require("../../assets/icons/offline-cloud.png")}
              title="Works Offline"
              description="Use the app anytime, anywhere. Your data stays private and secure on your device."
            />
            <FeatureCard
              icon={require("../../assets/icons/upload-cloud.png")}
              title="Sync When Online"
              description="Data syncs automatically when internet is available to keep records up to date."
            />
          </View>
        </View>

        {/* Slide 3: Permissions */}
        <View className="px-8 justify-center" style={{ width: SCREEN_WIDTH }}>
          <View className="flex-1 justify-center">
            {/* Shield icon */}
            <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center self-center mb-6">
              <Text className="text-3xl">🛡️</Text>
            </View>

            <Text className="text-2xl font-bold text-navy text-center mb-2">
              Your Privacy Matters
            </Text>
            <Text className="text-sm text-gray-500 text-center mb-8">
              We need a few permissions to help DermSight work properly.
            </Text>

            <PermissionRow
              icon={require("../../assets/icons/camera.png")}
              label="Camera"
              description="Capture clear images of skin lesions for assessment."
            />
            <PermissionRow
              icon={require("../../assets/icons/image.png")}
              label="Photos & Storage"
              description="Save images and records securely on your device."
            />
            <PermissionRow
              icon={require("../../assets/icons/location-pin.png")}
              label="Location (Optional)"
              description="Add location to patient records for better follow-up."
            />

            <View className="flex-row items-center justify-center mt-6 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs">🔒</Text>
              <Text className="text-xs text-gray-500 ml-2">
                We never share your personal data. All data is encrypted and
                secure.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom section */}
      <View className="px-8 pb-10 pt-4">
        <Button
          title={
            currentSlide === 2
              ? "Continue"
              : currentSlide === 1
                ? "Next"
                : "Get Started"
          }
          onPress={handleGetStarted}
          iconRight={<Text className="text-white ml-2">→</Text>}
        />

        {/* Pagination dots */}
        <View className="flex-row justify-center mt-6 gap-2">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                i === currentSlide ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ImageSourcePropType;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="w-10 h-10 rounded-xl bg-primary-50 items-center justify-center mr-3">
        <Image
          source={icon}
          style={{ width: 24, height: 24 }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-navy mb-0.5">{title}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
    </View>
  );
}

function PermissionRow({
  icon,
  label,
  description,
}: {
  icon: ImageSourcePropType;
  label: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center bg-white border border-gray-100 rounded-2xl p-4 mb-3">
      <View className="w-10 h-10 rounded-xl bg-gray-50 items-center justify-center mr-3">
        <Image
          source={icon}
          style={{ width: 24, height: 24 }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-navy">{label}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
      <Text className="text-gray-300 text-lg">›</Text>
    </View>
  );
}
