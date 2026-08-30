import { useAssessmentsStore } from "@/features/assessments/store";
import { useAuthStore } from "@/features/auth/store";
import { usePatientsStore } from "@/features/patients/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ImageSourcePropType,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const { workerName } = useAuthStore();
  const { patients, loadPatients } = usePatientsStore();
  const { totalCount, pendingSyncCount, loadCounts } = useAssessmentsStore();
  const { isOffline } = useConnectivity();

  useEffect(() => {
    loadPatients();
    loadCounts();
  }, []);

  const handleStartAssessment = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.push("/patients");
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-slate-950"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-4 pb-5 border-b border-gray-100 dark:border-slate-800/80">
        <View className="flex-row items-center justify-between mb-1">
          <View>
            <Text className="text-xl font-bold text-navy dark:text-slate-100">
              Hello, {workerName || "User"}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-green-500"} mr-1.5`}
              />
              <Text className="text-xs text-gray-500 dark:text-slate-400">
                {isOffline ? "Device Offline" : "Device Online"}
              </Text>
            </View>
            <Pressable
              onPress={async () => {
                try {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }}
              className="w-9 h-9 rounded-full bg-gray-50 dark:bg-slate-800 items-center justify-center border border-gray-100/50 dark:border-slate-800"
            >
              <Text className="text-lg">🔔</Text>
            </Pressable>
            <View className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-950/30 items-center justify-center border border-primary-100/30 dark:border-primary-900/30">
              <Text className="text-primary dark:text-primary-400 font-bold text-sm">
                {(workerName || "U")[0].toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="p-5">
        {/* New Assessment CTA */}
        <Pressable
          onPress={handleStartAssessment}
          className="bg-primary dark:bg-primary-600 rounded-2xl p-5 mb-5 flex-row items-center shadow-sm"
        >
          <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-4">
            <Image
              source={require("../../../../assets/icons/home-camera.png")}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
              tintColor="#FFFFFF"
            />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              New Skin Assessment
            </Text>
            <Text className="text-white/80 text-sm mt-0.5">
              Capture or upload a lesion.
            </Text>
          </View>
          <Text className="text-white/60 text-2xl">›</Text>
        </Pressable>

        {/* Metric Cards - 2x2 Grid */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          <MetricCard
            icon={require("../../../../assets/icons/home-users.png")}
            title="Patients"
            value={`${patients.length}`}
            subtitle="Records"
            onPress={() => router.push("/patients")}
          />
          <MetricCard
            icon={require("../../../../assets/icons/home-checklist.png")}
            title="Assessments"
            value={`${totalCount}`}
            subtitle="Total"
            onPress={() => router.push("/assessments")}
          />
          <MetricCard
            icon={require("../../../../assets/icons/home-cloud.png")}
            title="Pending Sync"
            value={`${pendingSyncCount}`}
            subtitle="Records"
            onPress={() => router.push("/assessments")}
          />
          <MetricCard
            icon={require("../../../../assets/icons/home-chart.png")}
            title="Reports"
            value="View"
            subtitle="Summary"
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
            }}
          />
        </View>

        {/* Offline Status Banner */}
        {isOffline && (
          <View className="flex-row items-center bg-green-50/20 dark:bg-green-950/20 border border-green-100/50 dark:border-green-900/30 rounded-2xl p-4">
            <Image
              source={require("../../../../assets/icons/home-wifi-off.png")}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
              tintColor="#10B981"
            />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium text-green-800 dark:text-green-300">
                You are offline
              </Text>
              <Text className="text-xs text-green-600 dark:text-green-455 mt-0.5">
                Data will sync automatically when connection is available.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  onPress,
}: {
  icon: ImageSourcePropType;
  title: string;
  value: string;
  subtitle: string;
  onPress: () => void;
}) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800/80 shadow-sm"
      style={{ width: "48%" }}
    >
      <View className="flex-row items-center mb-2">
        <Image
          source={icon}
          style={{ width: 20, height: 20, marginRight: 8 }}
          contentFit="contain"
          tintColor="#0D9E94"
        />
        <Text className="text-sm text-gray-500 dark:text-slate-400">{title}</Text>
      </View>
      <Text className="text-2xl font-bold text-navy dark:text-slate-100">{value}</Text>
      <Text className="text-xs text-gray-400 dark:text-slate-500">{subtitle}</Text>
    </Pressable>
  );
}
