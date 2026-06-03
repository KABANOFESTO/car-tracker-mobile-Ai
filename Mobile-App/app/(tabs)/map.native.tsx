import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, StatusBar, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from "expo-router";

import { FleetMap } from "@/components/map/FleetMap.native";
import { FLEET_COLORS } from "@/constants/theme";
import { Vehicle } from "@/constants/types";
import { useGeofenceConfig } from "@/hooks/useGeofenceConfig";
import { useVehicles } from "@/hooks/useVehicles";

export default function MapScreen() {
  const { vehicles, stats } = useVehicles();
  const { config: geofenceConfig } = useGeofenceConfig();
  const { lat, lng } = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
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
        onVehiclePress={setSelectedVehicle}
        showSelectedVehicleCard={false}
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

      {selectedVehicle && (
        <View style={styles.detailWrap}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailLabel}>Live vehicle</Text>
                <Text style={styles.detailTitle}>{selectedVehicle.name}</Text>
                <Text style={styles.detailSub}>{selectedVehicle.licensePlate}</Text>
              </View>
              <View style={[styles.badge, selectedVehicle.isOutsideFence && styles.badgeAlert]}>
                <View
                  style={[
                    styles.badgeDot,
                    { backgroundColor: selectedVehicle.isOutsideFence ? FLEET_COLORS.orange : FLEET_COLORS.green },
                  ]}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: selectedVehicle.isOutsideFence ? FLEET_COLORS.orange : FLEET_COLORS.green },
                  ]}
                >
                  {selectedVehicle.isOutsideFence ? 'Outside fence' : selectedVehicle.status}
                </Text>
              </View>
            </View>

            <View style={styles.detailStats}>
              <StatBlock label="Speed" value={`${Math.round(selectedVehicle.speed)} km/h`} />
              <StatBlock label="Heading" value={`${Math.round(selectedVehicle.direction)}°`} />
              <StatBlock label="Satellites" value={String(selectedVehicle.satellites)} />
              <StatBlock label="HDOP" value={selectedVehicle.hdop.toFixed(1)} />
            </View>

            <Text style={styles.detailCoords}>
              {selectedVehicle.location.latitude.toFixed(5)}, {selectedVehicle.location.longitude.toFixed(5)}
            </Text>

            <Pressable style={styles.detailBtn} onPress={() => setSelectedVehicle(null)}>
              <Text style={styles.detailBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
  detailWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 140,
  },
  detailCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(11,14,39,0.95)',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 16,
    gap: 14,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  detailSub: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: `${FLEET_COLORS.green}22`,
    borderWidth: 1,
    borderColor: `${FLEET_COLORS.green}55`,
  },
  badgeAlert: {
    backgroundColor: `${FLEET_COLORS.orange}22`,
    borderColor: `${FLEET_COLORS.orange}55`,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: FLEET_COLORS.green,
  },
  badgeText: {
    color: FLEET_COLORS.green,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBlock: {
    width: '48%',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  statLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  statValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  detailCoords: {
    color: '#C9D1F2',
    fontSize: 12,
    fontWeight: '600',
  },
  detailBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: FLEET_COLORS.primary,
  },
  detailBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});


