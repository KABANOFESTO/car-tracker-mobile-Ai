import { Ionicons } from '@expo/vector-icons';
import React, { MutableRefObject, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, MapPressEvent, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { FLEET_COLORS } from '@/constants/theme';
import { announceMapCenter } from '@/services/voiceAssistantService';

interface Props {
  mapRef: MutableRefObject<{ animateToRegion?: (region: Region, duration?: number) => void } | null>;
  latitude: number;
  longitude: number;
  radius: number;
  onSelectCenter?: (coords: { latitude: number; longitude: number }) => void;
}

const DEFAULT_REGION: Region = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export function GeofencePreview({ mapRef, latitude, longitude, radius, onSelectCenter }: Props) {
  const mapInstanceRef = useRef<MapView | null>(null);
  const currentRegion = useMemo<Region>(() => {
    if (latitude !== 0 && longitude !== 0) {
      return {
        latitude,
        longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
    }

    return DEFAULT_REGION;
  }, [latitude, longitude]);

  const hasSelectedCenter = latitude !== 0 && longitude !== 0;
  const centerLabel = hasSelectedCenter
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : 'Tap the map to choose a center';

  function updateCenter(event: MapPressEvent) {
    const next = event.nativeEvent.coordinate;
    onSelectCenter?.(next);
    announceMapCenter(next).catch(() => undefined);
    mapInstanceRef.current?.animateToRegion(
      {
        latitude: next.latitude,
        longitude: next.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      350,
    );
  }

  useEffect(() => {
    if (!latitude || !longitude) return;
    mapInstanceRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      350,
    );
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapRef) return;
    mapRef.current = {
      animateToRegion(region: Region, duration?: number) {
        mapInstanceRef.current?.animateToRegion(region, duration);
      },
    };
    return () => {
      mapRef.current = null;
    };
  }, [mapRef]);

  return (
    <View style={styles.mapBox}>
      <MapView
        ref={mapInstanceRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentRegion}
        customMapStyle={DARK_MAP_STYLE}
        onPress={updateCenter}
        showsCompass={false}
        showsScale={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {hasSelectedCenter && (
          <>
            <Circle
              center={{ latitude, longitude }}
              radius={radius}
              strokeColor={FLEET_COLORS.primary}
              strokeWidth={2}
              fillColor={`${FLEET_COLORS.primary}22`}
            />
            <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.markerWrap}>
                <View style={styles.markerGlow} />
                <View style={styles.markerPin}>
                  <Ionicons name="location" size={18} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          </>
        )}
      </MapView>

      <View style={styles.overlayTop}>
        <View style={styles.pill}>
          <Ionicons name="map-outline" size={12} color={FLEET_COLORS.primary} />
          <Text style={styles.pillText}>Tap to set geofence center</Text>
        </View>
        <Text style={styles.heroTitle}>Interactive geofence preview</Text>
        <Text style={styles.heroBody}>
          Tap anywhere to place the center, then adjust the radius from the form below. This matches the live tracking logic used by the fleet.
        </Text>
      </View>

      <View style={styles.overlayBottom}>
        <View style={styles.centerCard}>
          <Text style={styles.centerLabel}>CENTER</Text>
          <Text style={styles.centerValue}>{centerLabel}</Text>
        </View>
        <View style={styles.radiusCard}>
          <Text style={styles.centerLabel}>RADIUS</Text>
          <Text style={styles.centerValue}>{Math.round(radius)} m</Text>
        </View>
      </View>

      <Pressable
        style={styles.recenterBtn}
        onPress={() => {
          const next = {
            latitude: DEFAULT_REGION.latitude,
            longitude: DEFAULT_REGION.longitude,
          };
          onSelectCenter?.(next);
          announceMapCenter(next).catch(() => undefined);
          mapInstanceRef.current?.animateToRegion(
            {
              ...next,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            },
            350,
          );
        }}
      >
        <Ionicons name="locate" size={18} color={FLEET_COLORS.primary} />
      </Pressable>
    </View>
  );
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0B0E27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#AEB7D6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0E27' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#2D3561' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#182042' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#2D3561' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#11183A' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#091122' }] },
];

const styles = StyleSheet.create({
  mapBox: {
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    marginBottom: 8,
    backgroundColor: FLEET_COLORS.surface,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerGlow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: FLEET_COLORS.primary + '25',
  },
  markerPin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: FLEET_COLORS.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FLEET_COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 8,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pillText: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroBody: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 320,
  },
  overlayBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    gap: 10,
  },
  centerCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
  },
  radiusCard: {
    width: 112,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.93)',
  },
  centerLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  centerValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  recenterBtn: {
    position: 'absolute',
    top: 12,
    right: 10,
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
