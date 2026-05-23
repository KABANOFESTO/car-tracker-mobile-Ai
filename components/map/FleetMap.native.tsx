import { FLEET_COLORS } from "@/constants/theme";
import { GeofenceConfig, Vehicle } from "@/constants/types";
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Platform, StyleProp, StyleSheet, ViewStyle } from "react-native";
import MapView, { Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { VehicleMarker } from "./VehicleMarker.native";

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

const KIGALI = { latitude: -1.9441, longitude: 30.0619, latitudeDelta: 0.05, longitudeDelta: 0.05 };

function hasValidLocation(v: Vehicle) {
  return v.location.latitude !== 0 || v.location.longitude !== 0;
}

export const FleetMap = forwardRef<FleetMapRef, Props>(
  ({ vehicles, onVehiclePress, focusCoordinate, geofenceConfig, style }, ref) => {
    const mapRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      async zoomIn() {
        if (!mapRef.current) return;
        const camera = await mapRef.current.getCamera();
        mapRef.current.animateCamera({ zoom: (camera.zoom ?? 14) + 1 }, { duration: 300 });
      },
      async zoomOut() {
        if (!mapRef.current) return;
        const camera = await mapRef.current.getCamera();
        mapRef.current.animateCamera({ zoom: Math.max(1, (camera.zoom ?? 14) - 1) }, { duration: 300 });
      }
    }));

    useEffect(() => {
      if (!focusCoordinate || !mapRef.current) return;
      mapRef.current.animateToRegion(
        {
          latitude: focusCoordinate.latitude,
          longitude: focusCoordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005
        },
        600
      );
    }, [focusCoordinate]);

    const vehiclesWithLocation = vehicles.filter(hasValidLocation);
    const initialRegion =
      vehiclesWithLocation.length > 0
        ? {
            latitude: vehiclesWithLocation[0].location.latitude,
            longitude: vehiclesWithLocation[0].location.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
          }
        : KIGALI;

    return (
      <MapView
        ref={mapRef}
        style={[styles.map, style]}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {geofenceConfig ? (
          <Circle
            center={{ latitude: geofenceConfig.geofenceLat, longitude: geofenceConfig.geofenceLng }}
            radius={geofenceConfig.radius}
            strokeColor={FLEET_COLORS.primary}
            fillColor={FLEET_COLORS.primary + "22"}
            strokeWidth={2}
          />
        ) : null}

        {vehiclesWithLocation.map((vehicle) => (
          <VehicleMarker key={vehicle.id} vehicle={vehicle} onPress={onVehiclePress} />
        ))}
      </MapView>
    );
  }
);

const styles = StyleSheet.create({
  map: { flex: 1 },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0B0E27" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8892B0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0E27" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1A1F3C" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#2D3561" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1A1F3C" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0D1B4B" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1A1F3C" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6B728F" }] }
];
