/**
 * Login screen — offline-capable PIN login.
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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
        setError("Please enter a 4-digit PIN.");
        return;
      }
      const success = await loginWithPin(pin);
      if (success) {
        router.replace("/(app)/home");
      } else {
        setError("Incorrect PIN. Please try again.");
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("Please enter both email/worker ID and password.");
        return;
      }
      if (isOffline) {
        setError("Email login requires an internet connection. Please use PIN login.");
        return;
      }
      const success = await loginWithEmail(email.trim(), password);
      if (success) {
        const currentPinSet = useAuthStore.getState().pinSet;
        if (currentPinSet) {
          router.replace("/(app)/home");
        } else {
          router.replace("/(auth)/pin-setup");
        }
      } else {
        setError("Incorrect email or password, or no health worker profile found.");
      }
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    >
      <View className="px-8 py-6">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-primary-50 items-center justify-center mb-4">
            <Image
              source={require("../../../assets/logo.png")}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-navy">Welcome Back</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Sign in to continue.
          </Text>
        </View>

        {pinMode ? (
          /* PIN Mode */
          <View>
            <Text className="text-base font-semibold text-navy mb-4 text-center">
              Enter your 4-digit PIN
            </Text>
            <View className="flex-row justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <Pressable
                  key={i}
                  className={`w-14 h-14 rounded-2xl border-2 items-center justify-center ${
                    pin.length > i
                      ? "border-primary bg-primary-50"
                      : "border-gray-200"
                  }`}
                >
                  {pin.length > i && (
                    <View className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </Pressable>
              ))}
            </View>
            <View className="flex-row justify-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((num, idx) => (
                <Pressable
                  key={idx}
                  className={`w-16 h-14 rounded-xl items-center justify-center ${
                    num !== null ? "bg-gray-50" : ""
                  }`}
                  onPress={() => {
                    if (num === "del") {
                      setPin(pin.slice(0, -1));
                    } else if (num !== null && pin.length < 4) {
                      setPin(pin + num);
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
          </View>
        ) : (
          /* Email/Password Mode */
          <View>
            <Input
              label="Worker ID / Email"
              placeholder="Enter your email or worker ID."
              value={email}
              onChangeText={setEmail}
              icon={<Text className="text-lg">👤</Text>}
            />
            <Input
              label="Password / PIN"
              placeholder="Enter your password or PIN."
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon={<Text className="text-lg">🔒</Text>}
            />
            <View className="flex-row items-center mb-4">
              <View className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 items-center justify-center mr-2">
                <Text className="text-white text-xs">✓</Text>
              </View>
              <Text className="text-sm text-gray-600">Remember me</Text>
            </View>
          </View>
        )}

        {error ? (
          <Text className="text-sm text-red-500 text-center mb-3">{error}</Text>
        ) : null}

        <Button
          title={pinMode ? "Login with PIN" : "Login"}
          onPress={handleLogin}
          loading={isLoading}
        />

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-4 text-sm text-gray-400">or</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {pinSet ? (
          <Button
            title={pinMode ? "Login with Email" : "Login with PIN"}
            onPress={() => {
              setPinMode(!pinMode);
              setError("");
            }}
            variant="outline"
            icon={<Text className="mr-2">{pinMode ? "✉️" : "🔢"}</Text>}
          />
        ) : null}

        {/* Offline notice */}
        {isOffline && (
          <View className="flex-row items-center bg-gray-50 rounded-xl p-4 mt-6">
            <Text className="text-lg mr-3">📡</Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700">
                You are offline
              </Text>
              <Text className="text-xs text-gray-500">
                All core features are available offline.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
