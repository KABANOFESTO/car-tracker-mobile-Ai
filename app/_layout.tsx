import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useRootNavigationState, useSegments } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, { FadeOut } from "react-native-reanimated";
import { AuthSessionProvider, useAuthSession } from "@/hooks/useAuthSession";
import { configureNotifications, requestNotificationPermissions } from "@/services/notificationService";
import { useBackendSync } from "@/hooks/useBackendSync";

// Keep the native splash visible until we're ready to show our custom one
SplashScreen.preventAutoHideAsync();

const DARK_BG = "#0B0E27";
const LIGHT_BG = "#F0F2FF";
const PRIMARY = "#4F6EF7";

export const unstable_settings = {
  anchor: "(tabs)"
};

function AppRouteGuard({ splashReady }: { splashReady: boolean }) {
  const navigationState = useRootNavigationState();
  const segments = useSegments();
  const { session, user, loading } = useAuthSession();

  useEffect(() => {
    if (!navigationState?.key || !splashReady || loading) return;

    const topSegment = segments[0] ?? "";
    const onLogin = topSegment === "login";
    const onPasswordChange = topSegment === "change-password";
    const onAdmin = topSegment === "admin";

    if (!session) {
      if (!onLogin) {
        router.replace("/login" as never);
      }
      return;
    }

    if (user?.mustChangePassword) {
      if (!onPasswordChange) {
        router.replace("/change-password" as never);
      }
      return;
    }

    if (onLogin || onPasswordChange) {
      router.replace((user?.role === "admin" ? "/admin/users" : "/(tabs)") as never);
      return;
    }

    if (onAdmin && user?.role !== "admin") {
      router.replace("/(tabs)/settings" as never);
    }
  }, [loading, navigationState?.key, segments, session, splashReady, user?.mustChangePassword, user?.role]);

  return null;
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const [ready, setReady] = useState(false);
  const { loading } = useAuthSession();
  useBackendSync();

  useEffect(() => {
    // Immediately swap from native splash to our JS splash (seamless because same bg color)
    SplashScreen.hideAsync();
    const t = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    configureNotifications().catch(() => undefined);
    requestNotificationPermissions().catch(() => undefined);

    const subscription = Notifications.addNotificationResponseReceivedListener((event) => {
      const vehicleId = typeof event.notification.request.content.data?.vehicleId === "string"
        ? event.notification.request.content.data.vehicleId
        : null;

      if (vehicleId) {
        router.push(`/vehicle/${vehicleId}` as never);
        return;
      }

      router.push("/alerts" as never);
    });

    return () => subscription.remove();
  }, []);

  const bg = isDark ? DARK_BG : LIGHT_BG;
  const textColor = isDark ? "#FFFFFF" : "#0B0E27";

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen
            name="register"
            options={{
              headerShown: true,
              title: "Connect ThingSpeak Channel",
              headerStyle: { backgroundColor: "#0B0E27" },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { color: "#FFFFFF", fontWeight: "600" }
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: true,
              title: "Sign In",
              headerStyle: { backgroundColor: "#0B0E27" },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { color: "#FFFFFF", fontWeight: "600" }
            }}
          />
          <Stack.Screen
            name="change-password"
            options={{
              headerShown: true,
              title: "Secure your account",
              headerStyle: { backgroundColor: "#0B0E27" },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { color: "#FFFFFF", fontWeight: "600" }
            }}
          />
          <Stack.Screen
            name="vehicle/[id]"
            options={{
              headerShown: true,
              title: "Vehicle Details",
              headerStyle: { backgroundColor: "#0B0E27" },
              headerTintColor: "#FFFFFF",
              headerTitleStyle: { color: "#FFFFFF", fontWeight: "600" }
            }}
          />
          <Stack.Screen
            name="alerts"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="trips/[vehicleId]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="reports/export"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <AppRouteGuard splashReady={ready} />
        <StatusBar style={isDark ? "light" : "dark"} />

        {(!ready || loading) && (
          <Animated.View
            exiting={FadeOut.duration(500)}
            style={[styles.splash, { backgroundColor: bg }]}
          >
            <View style={styles.logoGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name="navigate" size={40} color="#FFFFFF" />
              </View>
              <Text style={[styles.appName, { color: textColor }]}>FleetPulse</Text>
              <Text style={styles.tagline}>Real-time IoT fleet tracking</Text>
            </View>
          </Animated.View>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function AppRoot() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthSessionProvider>
        <RootLayout />
      </AuthSessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logoGroup: {
    alignItems: "center",
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#8892B0",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
