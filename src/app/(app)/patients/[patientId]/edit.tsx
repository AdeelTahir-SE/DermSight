/**
 * Edit Patient Information screen — modify patient demographics.
 */

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getPatientById, updatePatient } from "@/features/patients/repository";
import { usePatientsStore } from "@/features/patients/store";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

function formatDateForInput(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
  }
  return isoDate;
}

export default function EditPatientScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const router = useRouter();
  const { updatePatientInStore } = usePatientsStore();

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId)
        .then((patient) => {
          if (patient) {
            setFirstName(patient.firstName);
            setLastName(patient.lastName);
            setDob(formatDateForInput(patient.dateOfBirth));
            setSex(patient.sex);
            setPhone(patient.phone || "");
            setAddress(patient.address || "");
            setNotes(patient.notes || "");
          }
          setLoading(false);
        })
        .catch(() => {
          if (Platform.OS === "web") {
            window.alert("Failed to load patient details.");
          } else {
            Alert.alert("Error", "Failed to load patient details.");
          }
          setLoading(false);
        });
    }
  }, [patientId]);

  const handleDobChange = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, "");
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.substring(0, 2)} / ${cleaned.substring(2, 4)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 2)} / ${cleaned.substring(2, 4)} / ${cleaned.substring(4, 8)}`;
    }
    setDob(formatted);
  };

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
      const updated = await updatePatient(patientId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        sex: sex as "male" | "female" | "other",
        phone: phone || undefined,
        address: address || undefined,
        notes: notes || undefined,
      });
      updatePatientInStore(updated);
      if (Platform.OS === "web") {
        window.alert("Patient details updated successfully.");
        router.back();
      } else {
        Alert.alert("Success", "Patient details updated successfully.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      }
    } catch {
      if (Platform.OS === "web") {
        window.alert("Failed to update patient. Please try again.");
      } else {
        Alert.alert("Error", "Failed to update patient. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Loading patient details...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-navy px-5 pt-12 pb-6 rounded-b-[28px] shadow-sm">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4 w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
          >
            <Text className="text-white text-xl">←</Text>
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-white">Edit Patient Details</Text>
            <Text className="text-xs text-white/70 mt-0.5">Modify patient demographics and notes</Text>
          </View>
        </View>
      </View>

      <View className="p-5">
        {/* Card 1: Personal Info */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <Text className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
            Personal Information
          </Text>

          <Input
            label="First Name *"
            placeholder="Enter first name"
            value={firstName}
            onChangeText={setFirstName}
            icon={
              <Image
                source={require("../../../../../assets/icons/np-person.png")}
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
                source={require("../../../../../assets/icons/np-person.png")}
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
            onChangeText={handleDobChange}
            icon={
              <Image
                source={require("../../../../../assets/icons/np-calendar.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#0D9E94"
              />
            }
            error={errors.dob}
            keyboardType="numeric"
          />

          {/* Gender selector */}
          <View className="mb-2">
            <Text className="text-sm font-medium text-navy mb-1.5">Gender *</Text>
            <View className="flex-row gap-3">
              {(["male", "female", "other"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSex(option)}
                  className={`flex-1 py-3.5 rounded-xl border flex-row items-center justify-center gap-2 ${
                    sex === option
                      ? "border-primary bg-primary-50 shadow-sm"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text className="text-base">
                    {option === "male" ? "👨" : option === "female" ? "👩" : "👥"}
                  </Text>
                  <Text
                    className={`text-sm font-semibold ${
                      sex === option ? "text-primary" : "text-gray-500"
                    }`}
                  >
                    {option === "male"
                      ? "Male"
                      : option === "female"
                        ? "Female"
                        : "Other"}
                  </Text>
                  {sex === option && (
                    <Text className="text-primary font-bold text-xs">✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
            {errors.sex && (
              <Text className="text-sm text-red-500 mt-1">{errors.sex}</Text>
            )}
          </View>
        </View>

        {/* Card 2: Contact Info */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <Text className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
            Contact Information
          </Text>
          <Input
            label="Phone Number"
            placeholder="03XX XXXXXX"
            value={phone}
            onChangeText={setPhone}
            icon={
              <Image
                source={require("../../../../../assets/icons/np-phone.png")}
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
                source={require("../../../../../assets/icons/np-location.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#0D9E94"
              />
            }
          />
        </View>

        {/* Card 3: Notes Info */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <Text className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
            Additional Information
          </Text>
          <Input
            label="Notes"
            placeholder="Enter medical history, symptoms, or any other notes"
            value={notes}
            onChangeText={setNotes}
            icon={
              <Image
                source={require("../../../../../assets/icons/np-notes.png")}
                style={{ width: 20, height: 20 }}
                contentFit="contain"
                tintColor="#0D9E94"
              />
            }
            multiline
          />
        </View>

        <View className="mt-4 mb-8">
          <Button title="Save Changes" onPress={handleSave} loading={saving} />
        </View>
      </View>
    </ScrollView>
  );
}
