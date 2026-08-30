import { ConnectivityBanner } from "@/components/ui/ConnectivityBanner";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { ImageSourcePropType, Platform, Text, View } from "react-native";
import { useThemeStore } from "@/features/theme/store";

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
  const inactiveColor = isDark ? "#64748B" : "#9CA3AF";

  return (
    <View className="items-center justify-center" style={{ width: 64 }}>
      {/* Active indicator dot */}
      <View
        className={`w-1.5 h-1.5 rounded-full mb-1 ${
          focused ? "bg-primary dark:bg-primary-400" : "bg-transparent"
        }`}
      />
      <Image
        source={icon}
        style={{
          width: 22,
          height: 22,
          opacity: focused ? 1 : 0.5,
          tintColor: focused ? activeColor : inactiveColor,
        }}
        contentFit="contain"
      />
      <Text
        className={`text-[10px] mt-1 ${
          focused
            ? "text-primary dark:text-primary-400 font-semibold"
            : "text-gray-400 dark:text-slate-500 font-medium"
        }`}
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
            backgroundColor: isDark ? "#111827" : "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1F2937" : "#F3F4F6",
            elevation: 0,
            shadowOpacity: 0,
            height: isIOS ? 82 : 64,
            paddingBottom: isIOS ? 20 : 8,
            paddingTop: 6,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#0D9E94",
          tabBarInactiveTintColor: isDark ? "#64748B" : "#9CA3AF",
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
