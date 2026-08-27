/**
 * App layout — Tab navigator for authenticated flow.
 * Home | Patients | Assessments (sync) | Settings
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { ConnectivityBanner } from '@/components/ui/ConnectivityBanner';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center py-1">
      <Text className={`text-xl ${focused ? '' : 'opacity-40'}`}>{icon}</Text>
      <Text className={`text-xs mt-0.5 ${focused ? 'text-primary font-medium' : 'text-gray-400'}`}>
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <View className="flex-1 bg-gray-50">
      <ConnectivityBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F5',
            elevation: 0,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🏠" label="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="👥" label="Patients" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="assessments"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="📋" label="Assessments" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="⚙️" label="Settings" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
