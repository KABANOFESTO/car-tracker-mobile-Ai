import React, { RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FLEET_COLORS } from "@/constants/theme";

interface Props {
  mapRef: RefObject<any>;
  latitude: number;
  longitude: number;
  radius: number;
}

export function GeofencePreview({ latitude, longitude, radius }: Props) {
  return (
    <View style={styles.mapFallback}>
      <Ionicons name="radio-outline" size={24} color={FLEET_COLORS.primary} />
      <Text style={styles.mapFallbackText}>
        Web preview shows the current center and radius. Interactive map is available on iOS and Android.
      </Text>
      <Text style={styles.mapFallbackMeta}>
        Center: {latitude || 0}, {longitude || 0} · Radius: {radius || 0} m
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFallback: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: FLEET_COLORS.surface,
    padding: 16
  },
  mapFallbackText: { color: FLEET_COLORS.textSecondary, fontSize: 12, textAlign: "center" },
  mapFallbackMeta: { color: FLEET_COLORS.primary, fontSize: 12, fontWeight: "600", textAlign: "center" },
});
