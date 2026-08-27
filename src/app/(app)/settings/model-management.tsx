/**
 * Model management screen — model version/update info.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function ModelManagementScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-1 mr-3">
            <Text className="text-xl">←</Text>
          </Pressable>
          <Text className="text-lg font-bold text-navy">Model Management</Text>
        </View>
      </View>

      <View className="p-5">
        {/* Current Model */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="text-sm font-semibold text-navy mb-3">Current Model</Text>

          <View className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="text-sm text-gray-500">Version</Text>
            <Text className="text-sm font-medium text-navy">1.0.0</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="text-sm text-gray-500">Architecture</Text>
            <Text className="text-sm font-medium text-navy">H-CBM (EfficientNet-B0)</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="text-sm text-gray-500">Training Dataset</Text>
            <Text className="text-sm font-medium text-navy">HAM10000 (10,015 images)</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-gray-50">
            <Text className="text-sm text-gray-500">Quantization</Text>
            <Text className="text-sm font-medium text-navy">INT8</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-gray-500">Size</Text>
            <Text className="text-sm font-medium text-navy">~6.2 MB</Text>
          </View>
        </View>

        {/* Model Info */}
        <View className="bg-primary-50 rounded-2xl p-4 flex-row items-start">
          <Text className="text-sm mr-2">ℹ️</Text>
          <Text className="text-xs text-primary-700 flex-1">
            The on-device ML model classifies skin lesions into 7 diagnostic categories
            and provides ABCD explainability scores. Model updates can be downloaded
            when connected to the internet.
          </Text>
        </View>
      </View>
    </View>
  );
}
