import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ActiveFleetSheet } from "@/components/fleet/ActiveFleetSheet";
import { FleetMap } from "@/components/map/FleetMap";
import { FLEET_COLORS } from "@/constants/theme";
import { useVehicles } from "@/hooks/useVehicles";

export default function FleetDashboardWeb() {
  const { vehicles, stats } = useVehicles();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
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
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapFrame}>
          <FleetMap vehicles={vehicles} />
        </View>

        <TouchableOpacity style={styles.fab} onPress={() => router.push("/register")} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.fabLabel}>Add Vehicle</Text>
        </TouchableOpacity>

        <ActiveFleetSheet vehicles={vehicles} stats={stats} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  topBar: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: FLEET_COLORS.background + "EE",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: FLEET_COLORS.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  logoText: { color: FLEET_COLORS.textPrimary, fontSize: 17, fontWeight: "700" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 4 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  mapFrame: {
    height: 260,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  fab: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: FLEET_COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
  },
  fabLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
