import { ConnectivityBanner } from "@/components/ui/ConnectivityBanner";
import { useThemeStore } from "@/features/theme/store";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { ImageSourcePropType, Platform, Text, View } from "react-native";

function TabIcon({
  icon,
  label,
  focused,
  isDark,
}: {
  icon: ImageSourcePropType;
  label: string;
  focused: boolean;
  isDark: boolean;
}) {
  const activeColor = "#0D9E94";
  const inactiveColor = isDark ? "#94A3B8" : "#9CA3AF";

  return (
    <View className="items-center justify-center" style={{ width: 70 }}>
      <Image
        source={icon}
        style={{
          width: 24,
          height: 24,
          tintColor: focused ? activeColor : inactiveColor,
        }}
        contentFit="contain"
      />
      <Text
        className="text-[11px] mt-1.5"
        style={{
          color: focused ? activeColor : inactiveColor,
          fontWeight: focused ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const isIOS = Platform.OS === "ios";
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      <ConnectivityBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1E293B" : "#F3F4F6",
            elevation: 0,
            shadowOpacity: 0,
            height: isIOS ? 84 : 64,
            paddingBottom: isIOS ? 22 : 8,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#0D9E94",
          tabBarInactiveTintColor: isDark ? "#94A3B8" : "#9CA3AF",
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
                isDark={isDark}
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
                isDark={isDark}
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
                isDark={isDark}
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
                isDark={isDark}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
