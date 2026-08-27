/**
 * New Patient Registration screen — intake form + geo-tag.
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/store";
import { createPatient } from "@/features/patients/repository";
import { usePatientsStore } from "@/features/patients/store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function NewPatientScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { addPatient } = usePatientsStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!dob.trim()) newErrors.dob = "Date of birth is required";
    if (!sex) newErrors.sex = "Please select a gender";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const patient = await createPatient(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          sex: sex as "male" | "female" | "other",
          phone: phone || undefined,
          address: address || undefined,
          notes: notes || undefined,
        },
        userId,
      );
      addPatient(patient);
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save patient. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <Text className="text-xl">←</Text>
        </Pressable>
        <View>
          <Text className="text-lg font-bold text-navy">
            New Patient Registration
          </Text>
          <Text className="text-xs text-gray-500">Enter patient details.</Text>
        </View>
      </View>

      <View className="p-5">
        {/* Personal Information */}
        <Text className="text-sm font-semibold text-primary mb-3">
          Personal Information
        </Text>

        <Input
          label="First Name *"
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
          icon={
            <Image
              source={require("../../../../assets/icons/np-person.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
              tintColor="#0D9E94"
            />
          }
          error={errors.firstName}
        />
        <Input
          label="Last Name *"
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
          icon={
            <Image
              source={require("../../../../assets/icons/np-person.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
              tintColor="#0D9E94"
            />
          }
          error={errors.lastName}
        />
        <Input
          label="Date of Birth *"
          placeholder="DD / MM / YYYY"
          value={dob}
          onChangeText={setDob}
          icon={
            <Image
              source={require("../../../../assets/icons/np-calendar.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
              tintColor="#0D9E94"
            />
          }
          error={errors.dob}
          keyboardType="default"
        />

        {/* Gender selector */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-navy mb-1.5">Gender *</Text>
          <View className="flex-row gap-3">
            {(["male", "female", "other"] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setSex(option)}
                className={`flex-1 py-3 rounded-xl border items-center ${
                  sex === option
                    ? "border-primary bg-primary-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    sex === option ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {option === "male"
                    ? "Male"
                    : option === "female"
                      ? "Female"
                      : "Other"}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors.sex && (
            <Text className="text-sm text-red-500 mt-1">{errors.sex}</Text>
          )}
        </View>

        {/* Contact Information */}
        <Text className="text-sm font-semibold text-primary mb-3 mt-4">
          Contact Information
        </Text>
        <Input
          label="Phone Number"
          placeholder="03XX XXXXXX"
          value={phone}
          onChangeText={setPhone}
          icon={
            <Image
              source={require("../../../../assets/icons/np-phone.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
              tintColor="#0D9E94"
            />
          }
          keyboardType="phone-pad"
        />
        <Input
          label="Address (Village / Area)"
          placeholder="Enter address"
          value={address}
          onChangeText={setAddress}
          icon={
            <Image
              source={require("../../../../assets/icons/np-location.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
              tintColor="#0D9E94"
            />
          }
        />

        {/* Additional Information */}
        <Text className="text-sm font-semibold text-primary mb-3 mt-4">
          Additional Information
        </Text>
        <Input
          label="Notes"
          placeholder="Any additional notes"
          value={notes}
          onChangeText={setNotes}
          icon={
            <Image
              source={require("../../../../assets/icons/np-notes.png")}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
              tintColor="#0D9E94"
            />
          }
          multiline
        />

        <View className="mt-4 mb-8">
          <Button title="Save Patient" onPress={handleSave} loading={saving} />
        </View>
      </View>
    </ScrollView>
  );
}
