import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "@/features/notifications/toastStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export default function PinSetupScreen() {
  const router = useRouter();
  const { setupPin, isLoading, workerName: authWorkerName } = useAuthStore();
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [workerName, setWorkerName] = useState("");

  const currentPin = step === "enter" ? pin : confirmPin;
  const setCurrentPin = step === "enter" ? setPin : setConfirmPin;

  const handleContinue = async () => {
    if (step === "enter") {
      if (pin.length !== 4) {
        const msg = "Please enter a 4-digit PIN.";
        setError(msg);
        toast.warning(msg);
        return;
      }
      setError("");
      setStep("confirm");
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
      return;
    }

    // Confirm step
    if (confirmPin !== pin) {
      const msg = "PINs do not match. Please try again.";
      setError(msg);
      toast.error(msg);
      setConfirmPin("");
      return;
    }

    await setupPin(pin, authWorkerName || workerName);
    toast.success("PIN configured successfully!");
    router.replace("/(app)/home");
  };

  const handleKeyPress = async (num: string | number | null) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    if (num === "del") {
      setCurrentPin(currentPin.slice(0, -1));
      setError("");
    } else if (num !== null && currentPin.length < 4) {
      setCurrentPin(currentPin + num);
      setError("");
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-950 justify-center px-8">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="w-36 h-36 rounded-[32px] bg-primary-50 dark:bg-primary-950/20 items-center justify-center mb-4 shadow-sm">
          <Image
            source={require("../../../assets/logo.png")}
            style={{ width: 104, height: 104 }}
            contentFit="contain"
          />
        </View>
        <Text className="text-2xl font-bold text-navy dark:text-slate-100">Set up your PIN</Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 text-center mt-2 px-4">
          Create a 4-digit PIN to secure your app and protect patient data.
        </Text>
      </View>

      {/* PIN input */}
      <Text className="text-sm font-medium text-navy dark:text-slate-200 mb-3 text-center">
        {step === "enter" ? "Enter 4-digit PIN" : "Confirm PIN"}
      </Text>

      <View className="flex-row justify-center gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={`w-14 h-14 rounded-2xl border-2 items-center justify-center ${
              currentPin.length > i
                ? "border-primary bg-primary-50 dark:bg-primary-950/20"
                : "border-gray-200 dark:border-slate-800"
            }`}
          >
            {currentPin.length > i && (
              <View className="w-3.5 h-3.5 rounded-full bg-primary dark:bg-primary-400" />
            )}
          </View>
        ))}
      </View>

      {/* Number pad */}
      <View className="flex-row justify-center gap-2.5 flex-wrap mb-6 max-w-[270px] self-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((num, idx) => (
          <Pressable
            key={idx}
            className={`w-[78px] h-14 rounded-2xl items-center justify-center ${
              num !== null ? "bg-gray-50 dark:bg-slate-900 border border-gray-100/50 dark:border-slate-800/80" : ""
            }`}
            onPress={() => handleKeyPress(num)}
            disabled={num === null}
          >
            {num === "del" ? (
              <Image
                source={require("../../../assets/icons/review-delete.png")}
                style={{ width: 22, height: 22 }}
                contentFit="contain"
                tintColor="#64748B"
              />
            ) : (
              <Text className="text-xl font-bold text-navy dark:text-slate-200">
                {num ?? ""}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      {error ? (
        <Text className="text-sm text-red-500 dark:text-red-400 text-center mb-3">{error}</Text>
      ) : null}

      {/* Info card */}
      <View className="bg-primary-50 dark:bg-primary-950/20 rounded-2xl p-4 mb-6 flex-row items-center border border-primary-100/50 dark:border-primary-900/30">
        <Image
          source={require("../../../assets/icons/settings-security.png")}
          style={{ width: 22, height: 22, marginRight: 12 }}
          contentFit="contain"
          tintColor="#0D9E94"
        />
        <Text className="text-xs text-primary-750 dark:text-primary-300 flex-1 leading-relaxed">
          {"Your PIN keeps your data private. You'll use this PIN to unlock the app."}
        </Text>
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        loading={isLoading}
        disabled={currentPin.length !== 4 || isLoading}
        iconRight={<Text className="text-white ml-2 font-bold">→</Text>}
      />
    </View>
  );
}
