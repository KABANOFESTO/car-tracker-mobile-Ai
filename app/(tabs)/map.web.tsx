import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { FleetMap } from "@/components/map/FleetMap";
import { FLEET_COLORS } from "@/constants/theme";
import { useVehicles } from "@/hooks/useVehicles";

export default function MapScreenWeb() {
  const { vehicles, stats } = useVehicles();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Map</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mapFrame}>
          <FleetMap vehicles={vehicles} />
        </View>

        <View style={styles.countCard}>
          <Ionicons name="navigate" size={14} color={FLEET_COLORS.primary} />
          <Text style={styles.countText}>{stats.total} vehicles</Text>
          <View style={styles.separator} />
          <View style={styles.dot} />
          <Text style={[styles.subCount, { color: FLEET_COLORS.green }]}>{stats.moving} moving</Text>
          <View style={styles.dot2} />
          <Text style={[styles.subCount, { color: FLEET_COLORS.orange }]}>{stats.idle} idle</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: "700" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  mapFrame: {
    height: 320,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  countCard: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: FLEET_COLORS.border,
  },
  countText: { color: FLEET_COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  separator: { width: 1, height: 12, backgroundColor: FLEET_COLORS.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: FLEET_COLORS.green },
  dot2: { width: 6, height: 6, borderRadius: 3, backgroundColor: FLEET_COLORS.orange },
  subCount: { fontSize: 12, fontWeight: "500" },
});
