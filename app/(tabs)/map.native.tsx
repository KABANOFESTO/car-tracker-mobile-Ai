import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from "expo-router";

import { FleetMap } from "@/components/map/FleetMap";
import { FLEET_COLORS } from "@/constants/theme";
import { useGeofenceConfig } from "@/hooks/useGeofenceConfig";
import { useVehicles } from "@/hooks/useVehicles";

export default function MapScreen() {
  const { vehicles, stats } = useVehicles();
  const { config: geofenceConfig } = useGeofenceConfig();
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const focusCoordinate = useMemo(() => {
    const latitude = parseFloat(lat ?? '');
    const longitude = parseFloat(lng ?? '');
    if (!isNaN(latitude) && !isNaN(longitude)) return { latitude, longitude };
    return null;
  }, [lat, lng]);

  return (
    <View style={styles.container}>
      <FleetMap
        vehicles={vehicles}
        style={StyleSheet.absoluteFill}
        focusCoordinate={focusCoordinate}
        geofenceConfig={geofenceConfig}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.countCard}>
          <Ionicons name="navigate" size={14} color={FLEET_COLORS.primary} />
          <Text style={styles.countText}>{stats.total} vehicles</Text>
          <View style={styles.separator} />
          <View style={styles.dot} />
          <Text style={[styles.subCount, { color: FLEET_COLORS.green }]}>{stats.moving} moving</Text>
          <View style={styles.dot2} />
          <Text style={[styles.subCount, { color: FLEET_COLORS.orange }]}>{stats.idle} idle</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  overlay: { position: "absolute", top: 0, left: 0, right: 0 },
  countCard: {
    flexDirection: "row", alignItems: "center", alignSelf: "center", gap: 6,
    backgroundColor: FLEET_COLORS.background + "EE",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    borderWidth: 1, borderColor: FLEET_COLORS.border,
  },
  countText: { color: FLEET_COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  separator: { width: 1, height: 12, backgroundColor: FLEET_COLORS.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: FLEET_COLORS.green },
  dot2: { width: 6, height: 6, borderRadius: 3, backgroundColor: FLEET_COLORS.orange },
  subCount: { fontSize: 12, fontWeight: "500" },
});


