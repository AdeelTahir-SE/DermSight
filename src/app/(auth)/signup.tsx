import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { useConnectivity } from "@/hooks/useConnectivity";
import { toast } from "@/features/notifications/toastStore";
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
      const msg = "All fields are required.";
      setError(msg);
      toast.warning(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters.";
      setError(msg);
      toast.warning(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setError(msg);
      toast.warning(msg);
      return;
    }

    if (isOffline) {
      const msg = "You must be connected to the internet to sign up.";
      setError(msg);
      toast.warning(msg);
      return;
    }

    const res = await signUp(email.trim(), password, fullName.trim(), region.trim());
    if (res.success) {
      if (res.needsConfirmation) {
        toast.success("Verification email sent!");
        Alert.alert(
          "Confirmation Required",
          "Registration successful! Please check your email inbox to confirm your account before logging in.",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      } else {
        toast.success("Account created! Set your login PIN.");
        // Redirect to PIN Setup to configure offline credential
        router.replace("/(auth)/pin-setup");
      }
    } else {
      const msg = res.error || "Signup failed. Please try again.";
      setError(msg);
      toast.error(msg);
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
        <View className="items-center mb-6">
          <Image
            source={require("../../../assets/logo_with_text.png")}
            style={{ width: 230, height: 110 }}
            contentFit="contain"
          />
          <Text className="text-sm text-gray-500 dark:text-slate-400 mt-2 text-center">
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
            editable={!isLoading}
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
            label="Region / Village"
            placeholder="e.g. Dar es Salaam, Mwanza"
            value={region}
            onChangeText={setRegion}
            editable={!isLoading}
            icon={
              <Image
                source={require("../../../assets/icons/np-location.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#9CA3AF"
              />
            }
          />
          <Input
            label="Email Address"
            placeholder="Enter your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!isLoading}
            icon={
              <Image
                source={require("../../../assets/icons/np-envelope.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#9CA3AF"
              />
            }
          />
          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            icon={
              <Image
                  source={require("../../../assets/icons/settings-change-pin.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#9CA3AF"
              />
            }
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
            icon={
              <Image
                source={require("../../../assets/icons/settings-security.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#9CA3AF"
              />
            }
          />
        </View>

        {error ? (
          <Text className="text-sm text-red-500 dark:text-red-400 text-center mb-4">{error}</Text>
        ) : null}

        {/* Offline Warning Card */}
        {isOffline && (
          <View className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 mb-4 flex-row items-center">
            <Image
              source={require("../../../assets/icons/offline-cloud.png")}
              style={{ width: 24, height: 24, marginRight: 12 }}
              contentFit="contain"
              tintColor="#EA580C"
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Connection Required
              </Text>
              <Text className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                You must be online to register a new profile.
              </Text>
            </View>
          </View>
        )}

        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={isLoading}
          disabled={isOffline || isLoading}
        />

        {/* Link to login */}
        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-sm text-gray-500 dark:text-slate-400">Already have an account? </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <Text className="text-sm font-bold text-primary dark:text-primary-400">Log In</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
