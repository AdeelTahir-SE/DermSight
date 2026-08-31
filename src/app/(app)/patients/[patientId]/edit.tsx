import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deletePatient, getPatientById, updatePatient } from "@/features/patients/repository";
import { usePatientsStore } from "@/features/patients/store";
import { useThemeStore } from "@/features/theme/store";
import { toast } from "@/features/notifications/toastStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

function formatDateForInput(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]} / ${parts[1]} / ${parts[0]}`;
  }
  return isoDate;
}

export default function EditPatientScreen() {
  const { t } = useTranslation();
  const {
    patientId: rawPatientId,
    patientid: fallbackPatientId,
  } = useLocalSearchParams<{
    patientId?: string;
    patientid?: string;
  }>();
  const patientId = rawPatientId || fallbackPatientId || "";
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";
  const { updatePatientInStore, removePatientFromStore } = usePatientsStore();

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
  const [deleting, setDeleting] = useState(false);

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
          toast.error(t("patients:patientUpdateFailed", { defaultValue: "Failed to load patient details." }));
          setLoading(false);
        });
    }
  }, [patientId]);

  const handleDobChange = (text: string) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length > 8) return;
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.substring(0, 2)} / ${cleaned.substring(2, 4)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 2)} / ${cleaned.substring(2, 4)} / ${cleaned.substring(4, 8)}`;
    }
    setDob(formatted);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim())
      newErrors.firstName = t("patients:firstNameRequired", { defaultValue: "First name is required" });
    if (!lastName.trim())
      newErrors.lastName = t("patients:lastNameRequired", { defaultValue: "Last name is required" });

    // Comprehensive DOB validation
    if (!dob.trim()) {
      newErrors.dob = t("patients:dobRequired", { defaultValue: "Date of birth is required" });
    } else {
      const parts = dob.replace(/\s+/g, "").split(/[-/]/);
      if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
        newErrors.dob = t("patients:invalidDob", { defaultValue: "Please enter a valid date (DD / MM / YYYY)" });
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const currentYear = new Date().getFullYear();

        if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900 || year > currentYear || month < 1 || month > 12 || day < 1) {
          newErrors.dob = t("patients:invalidDob", { defaultValue: "Please enter a valid date (DD / MM / YYYY)" });
        } else {
          let maxDays = 31;
          if (month === 4 || month === 6 || month === 9 || month === 11) {
            maxDays = 30;
          } else if (month === 2) {
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            maxDays = isLeap ? 29 : 28;
          }

          if (day > maxDays) {
            newErrors.dob = t("patients:invalidDob", { defaultValue: "Please enter a valid date (DD / MM / YYYY)" });
          } else {
            const dobDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (dobDate > today) {
              newErrors.dob = t("patients:dobFuture", { defaultValue: "Date of birth cannot be in the future" });
            }
          }
        }
      }
    }

    if (!sex) newErrors.sex = t("patients:genderRequired", { defaultValue: "Please select a gender" });
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
      toast.success(t("patients:patientUpdated", { defaultValue: "Patient details updated successfully!" }));
      router.back();
    } catch {
      toast.error(t("patients:patientUpdateFailed", { defaultValue: "Failed to update patient. Please try again." }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("patients:deletePatientConfirm", { defaultValue: "Delete Patient Record?" }),
      t("patients:deletePatientDesc", {
        defaultValue:
          "Are you sure you want to delete this patient? All local records associated with this patient will be removed. This action cannot be undone.",
      }),
      [
        { text: t("common:cancel", { defaultValue: "Cancel" }), style: "cancel" },
        {
          text: t("common:delete", { defaultValue: "Delete" }),
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePatient(patientId);
              removePatientFromStore(patientId);
              toast.success(t("patients:patientDeleted", { defaultValue: "Patient deleted successfully" }));
              router.replace("/(app)/patients" as any);
            } catch (e) {
              console.error(e);
              toast.error(t("patients:patientDeleteFailed", { defaultValue: "Failed to delete patient" }));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const selectGender = (option: "male" | "female" | "other") => {
    setSex(option);
    setErrors((prev: Record<string, string>) => {
      if (!prev.sex) return prev;
      const next = { ...prev };
      delete next.sex;
      return next;
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <Text className="text-gray-500 dark:text-slate-400">
          {t("patients:loadingPatient", { defaultValue: "Loading patient details..." })}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-3 pb-4 border-b border-[#EBF2F1] dark:border-slate-800">
        <View className="flex-row items-center">
          <Pressable
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              router.back();
            }}
            className="mr-3.5 p-1"
          >
            <Image
              source={require("../../../../../assets/icons/profile-back.png")}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
              tintColor={isDark ? "#E2E8F0" : "#1B2B4B"}
            />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-[#1B2B4B] dark:text-slate-100">
              {t("patients:editTitle", { defaultValue: "Edit Patient Details" })}
            </Text>
            <Text className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              {t("patients:editSubtitle", { defaultValue: "Modify patient demographics and notes" })}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 bg-gray-50 dark:bg-slate-950" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Card 1: Personal Info */}
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-800/80">
            <Text className="text-xs font-bold text-primary dark:text-primary-400 mb-4 uppercase tracking-wider">
              {t("patients:personalInfo", { defaultValue: "Personal Information" })}
            </Text>

            <Input
              label={`${t("patients:firstName", { defaultValue: "First Name" })} *`}
              placeholder={t("patients:firstNamePlaceholder", { defaultValue: "Enter first name" })}
              value={firstName}
              onChangeText={setFirstName}
              editable={!saving}
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
              label={`${t("patients:lastName", { defaultValue: "Last Name" })} *`}
              placeholder={t("patients:lastNamePlaceholder", { defaultValue: "Enter last name" })}
              value={lastName}
              onChangeText={setLastName}
              editable={!saving}
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
              label={`${t("patients:dateOfBirth", { defaultValue: "Date of Birth" })} *`}
              placeholder={t("patients:dobPlaceholder", { defaultValue: "DD / MM / YYYY" })}
              value={dob}
              onChangeText={handleDobChange}
              editable={!saving}
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
              <Text className="text-sm font-medium text-navy dark:text-slate-200 mb-1.5">
                {`${t("patients:gender", { defaultValue: "Gender" })} *`}
              </Text>
              <View className="flex-row gap-3">
                {(["male", "female", "other"] as const).map((option) => {
                  const isSelected = sex === option;
                  const iconSource =
                    option === "male"
                      ? require("../../../../../assets/icons/male-gender-icon.png")
                      : option === "female"
                        ? require("../../../../../assets/icons/female-gender-icon.png")
                        : require("../../../../../assets/icons/others-gender-icon.png");

                  const genderLabel =
                    option === "male"
                      ? t("patients:male", { defaultValue: "Male" })
                      : option === "female"
                        ? t("patients:female", { defaultValue: "Female" })
                        : t("patients:other", { defaultValue: "Other" });

                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.7}
                      onPress={() => selectGender(option)}
                      disabled={saving}
                      className={`flex-1 py-3.5 rounded-xl border flex-row items-center justify-center gap-1.5 ${
                        isSelected
                          ? "border-primary bg-primary-50 dark:bg-primary-950/20 shadow-sm"
                          : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <Image
                        source={iconSource}
                        style={{ width: 17, height: 17 }}
                        contentFit="contain"
                        tintColor={isSelected ? "#0D9E94" : "#9CA3AF"}
                      />
                      <Text
                        className={`text-sm font-semibold capitalize ${
                          isSelected ? "text-primary dark:text-primary-400" : "text-gray-500 dark:text-slate-400"
                        }`}
                      >
                        {genderLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.sex && (
                <Text className="text-sm text-red-500 dark:text-red-400 mt-1">{errors.sex}</Text>
              )}
            </View>
          </View>

          {/* Card 2: Contact Info */}
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-800/80">
            <Text className="text-xs font-bold text-primary dark:text-primary-400 mb-4 uppercase tracking-wider">
              {t("patients:contactInfo", { defaultValue: "Contact Information" })}
            </Text>
            <Input
              label={t("patients:phone", { defaultValue: "Phone Number" })}
              placeholder={t("patients:phonePlaceholder", { defaultValue: "03XX XXXXXX" })}
              value={phone}
              onChangeText={setPhone}
              editable={!saving}
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
              label={t("patients:address", { defaultValue: "Address (Village / Area)" })}
              placeholder={t("patients:addressPlaceholder", { defaultValue: "Enter address" })}
              value={address}
              onChangeText={setAddress}
              editable={!saving}
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
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-800/80">
            <Text className="text-xs font-bold text-primary dark:text-primary-400 mb-4 uppercase tracking-wider">
              {t("patients:additionalInfo", { defaultValue: "Additional Information" })}
            </Text>
            <Input
              label={t("patients:notes", { defaultValue: "Notes" })}
              placeholder={t("patients:notesPlaceholder", {
                defaultValue: "Enter medical history, symptoms, or any other notes",
              })}
              value={notes}
              onChangeText={setNotes}
              editable={!saving}
              icon={
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#0D9E94"
                />
              }
              multiline
            />
          </View>

          <View className="mt-4 mb-8 gap-3">
            <Button
              title={t("patients:updatePatient", { defaultValue: "Update Details" })}
              onPress={handleSave}
              loading={saving}
              disabled={saving || deleting}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDelete}
              disabled={saving || deleting}
              className="py-4 px-4 rounded-2xl bg-[#DC2626] flex-row items-center justify-center gap-2 shadow-sm active:opacity-90"
            >
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text className="text-[15px] font-bold text-white tracking-wide">
                {t("patients:deletePatient", { defaultValue: "Delete Patient" })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
  </SafeAreaView>
  );
}
