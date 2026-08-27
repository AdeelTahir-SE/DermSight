/**
 * Lesion Capture (Camera) screen — guided camera UI.
 * Uses placeholder for camera since react-native-vision-camera needs native modules.
 */

import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function CaptureScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<'photo' | 'guide'>('photo');
  const [showTips, setShowTips] = useState(false);

  const handleCapture = () => {
    // In production, this would capture a frame from the camera
    // For now, navigate to review with a mock image
    router.push({
      pathname: `/(app)/patients/${patientId}/review`,
      params: { mockImage: 'true' },
    });
  };

  return (
    <View className="flex-1 bg-black">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 absolute top-0 left-0 right-0 z-10">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
        >
          <Text className="text-white text-xl">✕</Text>
        </Pressable>
        <Pressable className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
          <Text className="text-white text-lg">⚡</Text>
        </Pressable>
        <Pressable className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
          <Text className="text-white text-lg">🔄</Text>
        </Pressable>
      </View>

      {/* Camera preview placeholder */}
      <View className="flex-1 items-center justify-center">
        {/* Instruction overlay */}
        <View className="absolute top-24 left-5 right-5 bg-black/50 rounded-xl p-3">
          <Text className="text-white text-sm text-center">
            Position the lesion within the frame and ensure good lighting.
          </Text>
        </View>

        {/* Framing guide */}
        <View className="w-64 h-64 relative">
          {/* Corner brackets */}
          <View className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-primary rounded-tl-lg" />
          <View className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-primary rounded-tr-lg" />
          <View className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-primary rounded-bl-lg" />
          <View className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-primary rounded-br-lg" />

          {/* Center crosshair */}
          <View className="absolute top-1/2 left-1/2 -ml-4 -mt-0.5 w-8 h-1 bg-primary/50 rounded" />
          <View className="absolute top-1/2 left-1/2 -ml-0.5 -mt-4 h-8 w-1 bg-primary/50 rounded" />
        </View>
      </View>

      {/* Bottom controls */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/80 pb-12 pt-4 px-5 rounded-t-3xl">
        {/* Mode tabs */}
        <View className="flex-row justify-center gap-1 mb-6">
          <Pressable
            onPress={() => setMode('photo')}
            className={`px-6 py-2 rounded-full ${mode === 'photo' ? 'bg-primary' : 'bg-white/10'}`}
          >
            <Text className={`text-sm font-medium ${mode === 'photo' ? 'text-white' : 'text-white/60'}`}>
              PHOTO
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('guide')}
            className={`px-6 py-2 rounded-full ${mode === 'guide' ? 'bg-primary' : 'bg-white/10'}`}
          >
            <Text className={`text-sm font-medium ${mode === 'guide' ? 'text-white' : 'text-white/60'}`}>
              GUIDE
            </Text>
          </Pressable>
        </View>

        {/* Shutter + side controls */}
        <View className="flex-row items-center justify-around">
          <Pressable className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center">
            <Text className="text-white text-xl">🖼️</Text>
          </Pressable>

          {/* Shutter button */}
          <Pressable onPress={handleCapture} className="w-18 h-18">
            <View className="w-18 h-18 rounded-full border-4 border-white items-center justify-center" style={{ width: 72, height: 72 }}>
              <View className="w-14 h-14 rounded-full bg-white" style={{ width: 56, height: 56 }} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setShowTips(!showTips)}
            className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center"
          >
            <Text className="text-white text-xl">💡</Text>
          </Pressable>
        </View>

        {/* Expandable tip */}
        {showTips && (
          <View className="mt-4 bg-white/10 rounded-xl p-3">
            <Text className="text-white/80 text-xs text-center">
              Capture clear, close-up image — Avoid shadows and keep steady.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
