import { useThemeStore } from "@/features/theme/store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  name,
  outlineName,
  label,
  focused,
  isDark,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  isDark: boolean;
}) {
  const activeColor = "#0D9E94";
  const inactiveColor = isDark ? "#94A3B8" : "#9CA3AF";

  return (
    <View className="items-center justify-center" style={{ width: 70 }}>
      <Ionicons
        name={focused ? name : outlineName}
        size={24}
        color={focused ? activeColor : inactiveColor}
      />
      <Text
        className="text-[11px] mt-1"
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
  const pathname = usePathname();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  const shouldHideTabs =
    pathname.includes("/capture") ||
    pathname.includes("/review") ||
    pathname.includes("/result") ||
    pathname.includes("/reports");

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: shouldHideTabs ? "none" : "flex",
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1E293B" : "#F3F4F6",
            elevation: 0,
            shadowOpacity: 0,
            height: isIOS ? 84 : 64 + bottomInset,
            paddingBottom: isIOS ? 22 : 8 + bottomInset,
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
                name="home"
                outlineName="home-outline"
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
                name="people"
                outlineName="people-outline"
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
                name="clipboard"
                outlineName="clipboard-outline"
                label="Sync"
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
                name="settings-sharp"
                outlineName="settings-outline"
                label="Settings"
                focused={focused}
                isDark={isDark}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
