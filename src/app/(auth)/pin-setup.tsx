/**
 * PIN Setup screen — first-run device enrollment.
 */

import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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
        setError("Please enter a 4-digit PIN.");
        return;
      }
      setError("");
      setStep("confirm");
      return;
    }

    // Confirm step
    if (confirmPin !== pin) {
      setError("PINs do not match. Please try again.");
      setConfirmPin("");
      return;
    }

    await setupPin(pin, authWorkerName || workerName);
    router.replace("/(app)/home");
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-6">
          <Text className="text-3xl">🔐</Text>
        </View>
        <Text className="text-2xl font-bold text-navy">Set up your PIN</Text>
        <Text className="text-sm text-gray-500 text-center mt-2 px-4">
          Create a 4-digit PIN to secure your app and protect patient data.
        </Text>
      </View>

      {/* PIN input */}
      <Text className="text-sm font-medium text-navy mb-3 text-center">
        {step === "enter" ? "Enter 4-digit PIN" : "Confirm PIN"}
      </Text>

      <View className="flex-row justify-center gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={`w-14 h-14 rounded-2xl border-2 items-center justify-center ${
              currentPin.length > i
                ? "border-primary bg-primary-50"
                : "border-gray-200"
            }`}
          >
            {currentPin.length > i && (
              <View className="w-3 h-3 rounded-full bg-primary" />
            )}
          </View>
        ))}
      </View>

      {/* Number pad */}
      <View className="flex-row justify-center gap-2 flex-wrap mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((num, idx) => (
          <Pressable
            key={idx}
            className={`w-16 h-14 rounded-xl items-center justify-center ${
              num !== null ? "bg-gray-50" : ""
            }`}
            onPress={() => {
              if (num === "del") {
                setCurrentPin(currentPin.slice(0, -1));
                setError("");
              } else if (num !== null && currentPin.length < 4) {
                setCurrentPin(currentPin + num);
                setError("");
              }
            }}
            disabled={num === null}
          >
            <Text className="text-lg font-medium text-navy">
              {num === "del" ? "⌫" : (num ?? "")}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? (
        <Text className="text-sm text-red-500 text-center mb-3">{error}</Text>
      ) : null}

      {/* Info card */}
      <View className="bg-primary-50 rounded-xl p-4 mb-6 flex-row items-center">
        <Text className="text-lg mr-3">ℹ️</Text>
        <Text className="text-xs text-primary-700 flex-1">
          {"Your PIN keeps your data private. You'll use this PIN to unlock the app."}
        </Text>
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        loading={isLoading}
        disabled={currentPin.length !== 4}
        iconRight={<Text className="text-white ml-2">→</Text>}
      />
    </View>
  );
}
