/**
 * PatientListItem — individual row in the patient list.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { Patient } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { calculateAge, formatDate } from '@/utils/date';

interface PatientListItemProps {
  patient: Patient;
  lastAssessmentDate?: string;
  onPress: () => void;
}

export function PatientListItem({ patient, lastAssessmentDate, onPress }: PatientListItemProps) {
  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const age = calculateAge(patient.dateOfBirth);
  const sexLabel = patient.sex === 'male' ? 'Male' : patient.sex === 'female' ? 'Female' : 'Other';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-white p-4 border-b border-gray-50"
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center mr-3">
        <Text className="text-primary font-bold text-sm">{initials}</Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-navy">
          {patient.firstName} {patient.lastName}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {patient.id.substring(0, 8).toUpperCase()} • {sexLabel} • {age} yrs
        </Text>
        {lastAssessmentDate && (
          <Text className="text-xs text-gray-400 mt-0.5">
            Last assessment: {formatDate(lastAssessmentDate)}
          </Text>
        )}
      </View>

      {/* Status */}
      <StatusBadge status={patient.syncStatus} />
    </Pressable>
  );
}
