import React, { RefObject } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { FLEET_COLORS } from "@/constants/theme";

interface Props {
  mapRef: RefObject<any>;
  latitude: number;
  longitude: number;
  radius: number;
}

export function GeofencePreview({ mapRef, latitude, longitude, radius }: Props) {
  if (latitude === 0) {
    return (
      <View style={styles.mapFallback}>
        <Ionicons name="radio-outline" size={24} color={FLEET_COLORS.primary} />
        <Text style={styles.mapFallbackText}>Set a geofence center to preview it.</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapBox}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: (radius / 111000) * 5,
          longitudeDelta: (radius / 111000) * 5
        }}
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        customMapStyle={darkMapStyle}>
        <Circle
          center={{ latitude, longitude }}
          radius={radius}
          strokeColor={FLEET_COLORS.primary}
          fillColor={FLEET_COLORS.primary + "33"}
          strokeWidth={2}
        />
      </MapView>
      <View style={styles.mapLabel}>
        <Ionicons name="radio-outline" size={12} color={FLEET_COLORS.primary} />
        <Text style={styles.mapLabelText}>Radius: {Math.round(radius)} m</Text>
      </View>
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={() =>
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: (radius / 111000) * 5,
              longitudeDelta: (radius / 111000) * 5
            },
            400
          )
        }
        activeOpacity={0.8}>
        <Ionicons name="locate" size={18} color={FLEET_COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    marginBottom: 4
  },
  map: { flex: 1 },
  recenterBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: FLEET_COLORS.surface + "EE",
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: "center",
    justifyContent: "center"
  },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: FLEET_COLORS.surface + "CC",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  mapLabelText: { color: FLEET_COLORS.primary, fontSize: 11, fontWeight: "600" },
  mapFallback: {
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: FLEET_COLORS.surface
  },
  mapFallbackText: { color: FLEET_COLORS.textSecondary, fontSize: 12 },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1f3c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b9cb3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0e27" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#253053" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b0e27" }] }
];
