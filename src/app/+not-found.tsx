/**
 * 404 Not Found screen.
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-6xl mb-4">🔍</Text>
      <Text className="text-xl font-bold text-navy mb-2">Page Not Found</Text>
      <Text className="text-sm text-gray-500 text-center mb-6">
        The page you're looking for doesn't exist.
      </Text>
      <Pressable
        onPress={() => router.replace('/(app)/home')}
        className="bg-primary px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">Go Home</Text>
      </Pressable>
    </View>
  );
}
