/**
 * App layout — Tab navigator for authenticated flow.
 * Home | Patients | Assessments (sync) | Settings
 */

import { ConnectivityBanner } from "@/components/ui/ConnectivityBanner";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { ImageSourcePropType, Text, View } from "react-native";

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
    <View className="items-center justify-center py-1">
      <Image
        source={icon}
        style={{ width: 24, height: 24, opacity: focused ? 1 : 0.4 }}
        contentFit="contain"
      />
      <Text
        className={`text-xs mt-0.5 ${focused ? "text-primary font-medium" : "text-gray-400"}`}
      >
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
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F5",
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
