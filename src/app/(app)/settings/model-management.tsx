import { Button } from "@/components/ui/Button";
import {
  checkForModelUpdate,
  downloadModelUpdate,
  getActiveModelInfo,
  type ActiveModelInfo,
  type UpdateCheckResult,
} from "@/features/model/manager";
import { toast } from "@/features/notifications/toastStore";
import { useConnectivity } from "@/hooks/useConnectivity";
import { useThemeStore } from "@/features/theme/store";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

const MODEL_ARCHITECTURE = "H-CBM / EfficientNet-B0";
const TRAINING_DATASET = "HAM10000 (10,015 images)";

export default function ModelManagementScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isOffline } = useConnectivity();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const [modelInfo, setModelInfo] = useState<ActiveModelInfo | null>(null);
  const [update, setUpdate] = useState<UpdateCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void refreshModelInfo();
  }, []);

  const refreshModelInfo = async () => {
    setLoading(true);
    const info = await getActiveModelInfo();
    setModelInfo(info);
    setLoading(false);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return t("common:noData");
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleCheckUpdates = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (isOffline) {
      toast.info(t("model:offline"));
      return;
    }

    setChecking(true);
    try {
      const result = await checkForModelUpdate();
      setUpdate(result);
      toast.info(
        result.updateAvailable && result.latestVersion
          ? t("model:updateAvailable", { version: result.latestVersion })
          : t("model:upToDate"),
      );
    } catch {
      toast.error(t("model:checkFailed"));
    } finally {
      setChecking(false);
    }
  };

  const handleDownload = async () => {
    if (!update?.fileName || !update.latestVersion) return;

    setDownloading(true);
    try {
      const next = await downloadModelUpdate(update.fileName, update.latestVersion);
      toast.success(t("model:downloadComplete", { version: next.versionTag }));
      setUpdate(null);
      await refreshModelInfo();
    } catch {
      toast.error(t("model:downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-slate-950" showsVerticalScrollIndicator={false}>
      <View className="bg-white dark:bg-slate-900 px-5 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center mr-2">
            <Image source={require("../../../../assets/icons/profile-back.png")} style={{ width: 22, height: 22 }} contentFit="contain" tintColor={isDark ? "#E2E8F0" : "#1B2B4B"} />
          </Pressable>
          <Text className="text-xl font-bold text-navy dark:text-slate-100">{t("model:title")}</Text>
        </View>
      </View>

      <View className="p-5">
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-semibold text-navy dark:text-slate-100">{t("model:currentModel")}</Text>
            {loading && <ActivityIndicator size="small" color="#0D9E94" />}
          </View>

          <InfoRow label={t("model:version")} value={modelInfo?.versionTag ?? "--"} />
          <InfoRow label={t("model:architecture")} value={MODEL_ARCHITECTURE} />
          <InfoRow label={t("model:trainingData")} value={TRAINING_DATASET} />
          <InfoRow label={t("model:format")} value="TensorFlow Lite INT8" />
          <InfoRow label={t("model:size")} value={formatSize(modelInfo?.sizeBytes ?? null)} />
          <InfoRow label={t("model:source")} value={modelInfo?.source === "downloaded" ? t("model:downloaded") : t("model:bundled")} />
          <InfoRow label={t("model:status")} value={modelInfo?.fileUri ? t("model:loaded") : t("model:notLoaded")} isLast />
        </View>

        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 mb-4">
          <Text className="text-base font-semibold text-navy dark:text-slate-100 mb-3">{t("model:checkUpdates")}</Text>
          <Text className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t("model:info")}</Text>
          <Button title={checking ? t("model:checking") : t("model:checkUpdates")} onPress={handleCheckUpdates} loading={checking} disabled={checking || downloading} />
          {update?.updateAvailable && update.latestVersion && (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-primary dark:text-primary-400 mb-3">
                {t("model:updateAvailable", { version: update.latestVersion })}
              </Text>
              <Button title={downloading ? t("model:downloading") : t("model:download")} onPress={handleDownload} loading={downloading} disabled={downloading} variant="secondary" />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View className={`flex-row justify-between py-3 ${isLast ? "" : "border-b border-gray-100 dark:border-slate-800"}`}>
      <Text className="text-sm text-gray-500 dark:text-slate-400 mr-4">{label}</Text>
      <Text className="text-sm font-semibold text-navy dark:text-slate-100 flex-1 text-right">{value}</Text>
    </View>
  );
}
