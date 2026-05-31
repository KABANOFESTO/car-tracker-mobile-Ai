import { FLEET_COLORS } from "@/constants/theme";
import { GeofenceConfig, Vehicle } from "@/constants/types";
import React, { forwardRef, useImperativeHandle } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

export interface FleetMapRef {
  zoomIn: () => void;
  zoomOut: () => void;
}

interface Props {
  vehicles: Vehicle[];
  onVehiclePress?: (vehicle: Vehicle) => void;
  focusCoordinate?: { latitude: number; longitude: number } | null;
  geofenceConfig?: GeofenceConfig | null;
  style?: StyleProp<ViewStyle>;
}

export const FleetMap = forwardRef<FleetMapRef, Props>(({ vehicles, style }, ref) => {
  useImperativeHandle(ref, () => ({
    zoomIn() {},
    zoomOut() {},
  }));

  return (
    <View style={[styles.webFallback, style]}>
      <Text style={styles.webIcon}>Map</Text>
      <Text style={styles.webTitle}>Fleet Map</Text>
      <Text style={styles.webSubtitle}>Interactive map is available on iOS and Android.</Text>
      <Text style={styles.webCount}>{vehicles.length} vehicles tracked</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    backgroundColor: FLEET_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  webIcon: { color: FLEET_COLORS.primary, fontSize: 24, fontWeight: "700" },
  webTitle: { color: FLEET_COLORS.textPrimary, fontSize: 20, fontWeight: "700" },
  webSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 14 },
  webCount: { color: FLEET_COLORS.primary, fontSize: 14, fontWeight: "600", marginTop: 8 }
});
