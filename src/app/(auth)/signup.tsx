/**
 * Signup screen — registers a new health worker account.
 * Requires internet connection to sync auth.
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { isOffline } = useConnectivity();

  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!fullName.trim() || !region.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isOffline) {
      setError("You must be connected to the internet to sign up.");
      return;
    }

    const res = await signUp(email.trim(), password, fullName.trim(), region.trim());
    if (res.success) {
      if (res.needsConfirmation) {
        Alert.alert(
          "Confirmation Required",
          "Registration successful! Please check your email inbox to confirm your account before logging in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      } else {
        // Redirect to PIN Setup to configure offline credential
        router.replace("/(auth)/pin-setup");
      }
    } else {
      setError(res.error || "Signup failed. Please try again.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-8 py-10">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-primary-50 items-center justify-center mb-4">
            <Image
              source={require("../../../assets/logo.png")}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-2xl font-bold text-navy">Create Account</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Register as a community health worker.
          </Text>
        </View>

        {/* Form Fields */}
        <View className="mb-4">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            icon={<Text className="text-lg">👤</Text>}
          />
          <Input
            label="Region / Village"
            placeholder="e.g. Dar es Salaam, Mwanza"
            value={region}
            onChangeText={setRegion}
            icon={<Text className="text-lg">📍</Text>}
          />
          <Input
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon={<Text className="text-lg">✉️</Text>}
          />
          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Text className="text-lg">🔒</Text>}
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon={<Text className="text-lg">🛡️</Text>}
          />
        </View>

        {error ? (
          <Text className="text-sm text-red-500 text-center mb-4">{error}</Text>
        ) : null}

        {/* Offline Warning Card */}
        {isOffline && (
          <View className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4 flex-row items-center">
            <Text className="text-lg mr-3">⚠️</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-orange-800">
                Connection Required
              </Text>
              <Text className="text-xs text-orange-700">
                You must be online to register a new profile.
              </Text>
            </View>
          </View>
        )}

        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={isLoading}
          disabled={isOffline}
        />

        {/* Link to login */}
        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-sm text-gray-500">Already have an account? </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-sm font-bold text-primary">Log In</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
