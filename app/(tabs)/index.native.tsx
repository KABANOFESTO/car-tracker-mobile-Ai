import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActiveFleetSheet } from "@/components/fleet/ActiveFleetSheet";
import { FleetMap, FleetMapRef } from "@/components/map/FleetMap.native";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { FLEET_COLORS } from "@/constants/theme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGeofenceConfig } from "@/hooks/useGeofenceConfig";
import { useProfilePreferences } from "@/hooks/useProfilePreferences";
import { useVehicles } from "@/hooks/useVehicles";

export default function FleetDashboard() {
  const { user } = useAuthSession();
  const { preferences } = useProfilePreferences(user?.id);
  const { vehicles, stats } = useVehicles();
  const { config: geofenceConfig } = useGeofenceConfig();
  const mapRef = useRef<FleetMapRef>(null);
  return (
    <View style={styles.container}>
      <FleetMap ref={mapRef} vehicles={vehicles} geofenceConfig={geofenceConfig} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.topSafe}>
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="navigate" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>FleetPulse</Text>
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/alerts" as never)}>
              <Ionicons name="notifications-outline" size={20} color={FLEET_COLORS.textPrimary} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push("/(tabs)/settings" as never)}>
              <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={34} showBadge={false} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapBtn} onPress={() => mapRef.current?.zoomIn()}>
          <Ionicons name="add" size={22} color={FLEET_COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.mapBtnSep} />
        <TouchableOpacity style={styles.mapBtn} onPress={() => mapRef.current?.zoomOut()}>
          <Ionicons name="remove" size={22} color={FLEET_COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/register")} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabLabel}>Add Vehicle</Text>
      </TouchableOpacity>

      <ActiveFleetSheet vehicles={vehicles} stats={stats} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background
  },
  topSafe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 8,
    backgroundColor: FLEET_COLORS.background + "EE",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: FLEET_COLORS.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  logoText: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "700"
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconBtn: {
    position: "relative",
    padding: 4
  },
  notifBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FLEET_COLORS.orange,
    borderWidth: 1.5,
    borderColor: FLEET_COLORS.background
  },
  avatarBtn: {
    alignItems: "center",
    justifyContent: "center"
  },
  mapControls: {
    position: "absolute",
    right: 16,
    bottom: 200,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    overflow: "hidden"
  },
  mapBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  mapBtnSep: {
    height: 1,
    backgroundColor: FLEET_COLORS.border
  },
  fab: {
    position: "absolute",
    bottom: 140,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: FLEET_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: FLEET_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6
  },
  fabLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  }
});


