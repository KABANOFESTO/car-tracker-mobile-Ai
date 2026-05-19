import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { FLEET_COLORS } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: FLEET_COLORS.primary,
        tabBarInactiveTintColor: FLEET_COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: FLEET_COLORS.background,
          borderTopColor: FLEET_COLORS.border,
          borderTopWidth: 1
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500"
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Fleet",
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="intelligence"
        options={{
          title: "AI",
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="geofence"
        options={{
          title: "Geofence",
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  );
}
