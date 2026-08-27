/**
 * App layout — Tab navigator for authenticated flow.
 * Home | Patients | Assessments (sync) | Settings
 */

import { ConnectivityBanner } from "@/components/ui/ConnectivityBanner";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { ImageSourcePropType, Platform, Text, View } from "react-native";

function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: ImageSourcePropType;
  label: string;
  focused: boolean;
}) {
  return (
    <View className="items-center justify-center" style={{ width: 64 }}>
      {/* Active indicator dot */}
      <View
        className={`w-1.5 h-1.5 rounded-full mb-1 ${
          focused ? "bg-primary" : "bg-transparent"
        }`}
      />
      <Image
        source={icon}
        style={{ width: 22, height: 22, opacity: focused ? 1 : 0.45 }}
        contentFit="contain"
      />
      <Text
        className={`text-[10px] mt-1 ${
          focused ? "text-primary font-semibold" : "text-gray-400 font-medium"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const isIOS = Platform.OS === "ios";

  return (
    <View className="flex-1 bg-gray-50">
      <ConnectivityBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            elevation: 0,
            shadowOpacity: 0,
            height: isIOS ? 82 : 64,
            paddingBottom: isIOS ? 20 : 8,
            paddingTop: 6,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#0D9E94",
          tabBarInactiveTintColor: "#9CA3AF",
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={require("../../../assets/icons/tab-home.png")}
                label="Home"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={require("../../../assets/icons/tab-patients.png")}
                label="Patients"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="assessments"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={require("../../../assets/icons/tab-assessments.png")}
                label="Assessments"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={require("../../../assets/icons/tab-settings.png")}
                label="Settings"
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
