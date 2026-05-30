import { Ionicons } from '@expo/vector-icons';
import React, { RefObject, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, MapPressEvent } from 'react-native-maps';

import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  mapRef: RefObject<MapView | null>;
  latitude: number;
  longitude: number;
  radius: number;
  onSelectCenter?: (coords: { latitude: number; longitude: number }) => void;
}

const DEFAULT_REGION = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export function GeofencePreview({ mapRef, latitude, longitude, radius, onSelectCenter }: Props) {
  const hasSelectedCenter = latitude !== 0 && longitude !== 0;
  const region = useMemo(
    () =>
      hasSelectedCenter
        ? {
            latitude,
            longitude,
            latitudeDelta: Math.max(0.002, (radius / 111000) * 5),
            longitudeDelta: Math.max(0.002, (radius / 111000) * 5),
          }
        : DEFAULT_REGION,
    [hasSelectedCenter, latitude, longitude, radius]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(region, 400);
  }, [mapRef, region]);

  function handleMapPress(event: MapPressEvent) {
    onSelectCenter?.({
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    });
  }

  return (
    <View style={styles.mapBox}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        onPress={onSelectCenter ? handleMapPress : undefined}
        customMapStyle={darkMapStyle}
      >
        {hasSelectedCenter ? (
          <>
            <Marker coordinate={{ latitude, longitude }} />
            <Circle
              center={{ latitude, longitude }}
              radius={radius}
              strokeColor={FLEET_COLORS.primary}
              fillColor={FLEET_COLORS.primary + '33'}
              strokeWidth={2}
            />
          </>
        ) : null}
      </MapView>

      <View style={styles.hintBubble}>
        <Ionicons name="map-outline" size={12} color={FLEET_COLORS.primary} />
        <Text style={styles.hintText}>Tap the map to set the geofence center</Text>
      </View>

      <View style={styles.radiusBadge}>
        <Ionicons name="radio-outline" size={12} color={FLEET_COLORS.primary} />
        <Text style={styles.radiusText}>Radius: {Math.round(radius)} m</Text>
      </View>

      <Pressable
        style={styles.recenterBtn}
        onPress={() => mapRef.current?.animateToRegion(region, 350)}
      >
        <Ionicons name="locate" size={18} color={FLEET_COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    marginBottom: 4,
    backgroundColor: FLEET_COLORS.surface,
  },
  map: { flex: 1 },
  recenterBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: FLEET_COLORS.surface + 'EE',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBubble: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FLEET_COLORS.surface + 'EE',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintText: { color: FLEET_COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  radiusBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FLEET_COLORS.surface + 'EE',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  radiusText: { color: FLEET_COLORS.primary, fontSize: 11, fontWeight: '700' },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1f3c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b9cb3' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0e27' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#253053' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0e27' }] },
];
