import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { toast } from "@/features/notifications/toastStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithPin, loginWithEmail, pinSet, isLoading } = useAuthStore();
  const { isOffline } = useConnectivity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pinMode, setPinMode] = useState(pinSet);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (pinMode) {
      if (pin.length !== 4) {
        const msg = "Please enter a 4-digit PIN.";
        setError(msg);
        toast.warning(msg);
        return;
      }
      const success = await loginWithPin(pin);
      if (success) {
        toast.success("Welcome back!");
        router.replace("/(app)/home");
      } else {
        const msg = "Incorrect PIN. Please try again.";
        setError(msg);
        toast.error(msg);
        setPin(""); // Clear code
      }
    } else {
      if (!email.trim() || !password.trim()) {
        const msg = "Please enter both email/worker ID and password.";
        setError(msg);
        toast.warning(msg);
        return;
      }
      if (isOffline) {
        const msg = "Email login requires an internet connection. Please use PIN login.";
        setError(msg);
        toast.warning(msg);
        return;
      }
      const success = await loginWithEmail(email.trim(), password);
      if (success) {
        toast.success("Logged in successfully!");
        const currentPinSet = useAuthStore.getState().pinSet;
        if (currentPinSet) {
          router.replace("/(app)/home");
        } else {
          router.replace("/(auth)/pin-setup");
        }
      } else {
        const msg = "Incorrect email or password, or no health worker profile found.";
        setError(msg);
        toast.error(msg);
      }
    }
  };

  const handleKeyPress = async (num: string | number | null) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    if (num === "del") {
      setPin(pin.slice(0, -1));
    } else if (num !== null && pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-slate-950"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-8 py-10 bg-white dark:bg-slate-950">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-36 h-36 rounded-[32px] bg-primary-50 dark:bg-primary-950/20 items-center justify-center mb-4 shadow-sm">
            <Image
              source={require("../../../assets/logo.png")}
              style={{ width: 104, height: 104 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-navy dark:text-slate-100">Welcome Back</Text>
          <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Sign in to continue.
          </Text>
        </View>

        {pinMode ? (
          /* PIN Mode */
          <View className="mb-6">
            <Text className="text-base font-semibold text-navy dark:text-slate-200 mb-4 text-center">
              Enter your 4-digit PIN
            </Text>
            <View className="flex-row justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <Pressable
                  key={i}
                  className={`w-14 h-14 rounded-2xl border-2 items-center justify-center ${
                    pin.length > i
                      ? "border-primary bg-primary-50 dark:bg-primary-950/20"
                      : "border-gray-200 dark:border-slate-800"
                  }`}
                >
                  {pin.length > i && (
                    <View className="w-3.5 h-3.5 rounded-full bg-primary dark:bg-primary-400" />
                  )}
                </Pressable>
              ))}
            </View>
            <View className="flex-row justify-center gap-2.5 flex-wrap max-w-[270px] self-center">
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
          </View>
        ) : (
          /* Email/Password Mode */
          <View>
            <Input
              label="Worker ID / Email"
              placeholder="Enter your email or worker ID."
              value={email}
              onChangeText={setEmail}
              icon={
                <Image
                  source={require("../../../assets/icons/np-person.png")}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                  tintColor="#9CA3AF"
                />
              }
            />
            <Input
              label="Password / PIN"
              placeholder="Enter your password or PIN."
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={
                <Image
                  source={require("../../../assets/splash-screens/privacy-matters-lock.png")}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                  tintColor="#9CA3AF"
                />
              }
            />
            <View className="flex-row items-center mb-6 mt-1">
              <View className="w-5 h-5 rounded border border-green-500 bg-green-500 dark:bg-green-600 items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
              <Text className="text-sm text-gray-600 dark:text-slate-400">Remember me</Text>
            </View>
          </View>
        )}

        {error ? (
          <Text className="text-sm text-red-500 dark:text-red-400 text-center mb-3">{error}</Text>
        ) : null}

        <Button
          title={pinMode ? "Login with PIN" : "Login"}
          onPress={handleLogin}
          loading={isLoading}
        />

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-150 dark:bg-slate-850" />
          <Text className="mx-4 text-sm text-gray-400 dark:text-slate-500">or</Text>
          <View className="flex-1 h-px bg-gray-150 dark:bg-slate-850" />
        </View>

        {pinSet ? (
          <Button
            title={pinMode ? "Login with Email" : "Login with PIN"}
            onPress={() => {
              setPinMode(!pinMode);
              setError("");
              setPin("");
            }}
            variant="outline"
            icon={
              pinMode ? (
                <Image
                  source={require("../../../assets/icons/np-envelope.png")}
                  style={{ width: 18, height: 18, marginRight: 8 }}
                  contentFit="contain"
                  tintColor="#0D9E94"
                />
              ) : (
                <Image
                  source={require("../../../assets/icons/settings-change-pin.png")}
                  style={{ width: 18, height: 18, marginRight: 8 }}
                  contentFit="contain"
                  tintColor="#0D9E94"
                />
              )
            }
          />
        ) : null}

        {/* Link to signup */}
        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-sm text-gray-500 dark:text-slate-400">{"Don't have an account? "}</Text>
          <Pressable onPress={() => router.replace("/(auth)/signup")}>
            <Text className="text-sm font-bold text-primary dark:text-primary-400">Sign Up</Text>
          </Pressable>
        </View>

        {/* Offline notice */}
        {isOffline && (
          <View className="flex-row items-center bg-gray-50 dark:bg-slate-900 border border-gray-100/50 dark:border-slate-800 rounded-2xl p-4 mt-6">
            <Image
              source={require("../../../assets/icons/offline-cloud.png")}
              style={{ width: 24, height: 24, marginRight: 12 }}
              contentFit="contain"
              tintColor="#64748B"
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                You are offline
              </Text>
              <Text className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                All core features are available offline.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
