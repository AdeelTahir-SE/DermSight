import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ImageSourcePropType,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, pinSet, isInitialized } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isInitialized) return;

    // Auto-redirect after brief splash display
    if (isAuthenticated) {
      router.replace("/(app)/home");
    } else if (pinSet) {
      router.replace("/(auth)/login");
    }
  }, [isInitialized, isAuthenticated, pinSet]);

  const handleGetStarted = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Safe check for web/simulator
    }

    if (currentSlide < 2) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      });
    } else {
      // Last onboarding slide — go to login
      router.replace("/(auth)/login");
    }
  };

  const handleMomentumScrollEnd = (e: any) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    if (slide !== currentSlide) {
      setCurrentSlide(slide);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (err) {}
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {/* Slide 1: Welcome */}
        <View
          className="w-full items-center justify-center px-8 bg-white dark:bg-slate-950"
          style={{ width: screenWidth }}
        >
          <View className="flex-1 items-center justify-center">
            {/* Logo */}
            <View className="w-52 h-52 rounded-[44px] bg-primary-50 dark:bg-primary-950/20 items-center justify-center mb-8 shadow-sm">
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 156, height: 156 }}
                contentFit="contain"
              />
            </View>

            <Text className="text-4xl font-bold text-center mb-2">
              <Text className="text-navy dark:text-slate-100">Derm</Text>
              <Text className="text-primary dark:text-primary-400">Sight</Text>
            </Text>

            <Text className="text-lg font-semibold text-navy dark:text-slate-200 text-center mb-2">
              AI-Powered Skin Cancer Screening
            </Text>

            <Text className="text-sm text-gray-500 dark:text-slate-400 text-center px-4">
              Offline. Private. Explainable.{"\n"}Built for community health
              workers.
            </Text>
          </View>
        </View>

        {/* Slide 2: Features */}
        <View className="px-6 justify-center bg-white dark:bg-slate-950" style={{ width: screenWidth }}>
          <View className="flex-1 justify-center py-4">
            <Text className="text-2xl font-bold text-center mb-1.5">
              <Text className="text-navy dark:text-slate-100">Smart Screening, </Text>
              <Text className="text-primary dark:text-primary-400">Better Outcomes</Text>
            </Text>
            <Text className="text-xs text-gray-500 dark:text-slate-400 text-center mb-5">
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
        <View className="px-6 justify-center bg-white dark:bg-slate-950" style={{ width: screenWidth }}>
          <View className="flex-1 justify-center py-4">
            {/* Privacy Shield icon */}
            <View className="w-24 h-24 rounded-3xl bg-primary-50 dark:bg-primary-950/20 items-center justify-center self-center mb-4">
              <Image
                source={require("../../assets/splash-screens/privacy-matters.png")}
                style={{ width: 76, height: 76 }}
                contentFit="contain"
              />
            </View>

            <Text className="text-2xl font-bold text-navy dark:text-slate-100 text-center mb-1.5">
              Your Privacy Matters
            </Text>
            <Text className="text-xs text-gray-500 dark:text-slate-400 text-center mb-4">
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
              label="Location"
              description="Add location to patient records for better follow-up."
            />

            <View className="flex-row items-center mt-3 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-3">
              <Image
                source={require("../../assets/splash-screens/privacy-matters-lock.png")}
                style={{ width: 24, height: 24, marginRight: 10 }}
                contentFit="contain"
              />
              <Text className="text-xs text-gray-500 dark:text-slate-400 flex-1 leading-snug">
                We never share your personal data. All data is encrypted and secure.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom section positioned above system navigation bar */}
      <View
        className="px-8 pt-2 bg-white dark:bg-slate-950"
        style={{ paddingBottom: Math.max(bottomInset + 32, 54) }}
      >
        {/* Pagination dots */}
        <View className="flex-row justify-center mb-4 gap-2">
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className={`h-2.5 rounded-full ${
                i === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-gray-200 dark:bg-slate-800"
              }`}
            />
          ))}
        </View>

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
    <View className="flex-row items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 mb-3 shadow-sm">
      <View className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 items-center justify-center mr-3.5">
        <Image
          source={icon}
          style={{ width: 44, height: 44 }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-navy dark:text-slate-200 mb-0.5">{title}</Text>
        <Text className="text-xs text-gray-500 dark:text-slate-400 leading-snug">{description}</Text>
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
    <View className="flex-row items-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 mb-3">
      <View className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 items-center justify-center mr-3.5">
        <Image
          source={icon}
          style={{ width: 44, height: 44 }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-navy dark:text-slate-200 mb-0.5">{label}</Text>
        <Text className="text-xs text-gray-500 dark:text-slate-400 leading-snug">{description}</Text>
      </View>
    </View>
  );
}
