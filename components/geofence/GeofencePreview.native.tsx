import { Ionicons } from '@expo/vector-icons';
import React, { RefObject, useImperativeHandle } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  mapRef: RefObject<{ animateToRegion?: (region: unknown, duration?: number) => void } | null>;
  latitude: number;
  longitude: number;
  radius: number;
  onSelectCenter?: (coords: { latitude: number; longitude: number }) => void;
}

const DEFAULT_REGION = {
  latitude: -26.2041,
  longitude: 28.0473,
};

export function GeofencePreview({ mapRef, latitude, longitude, radius, onSelectCenter }: Props) {
  const hasSelectedCenter = latitude !== 0 && longitude !== 0;
  const centerLabel = hasSelectedCenter
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : 'No center selected yet';

  useImperativeHandle(mapRef, () => ({
    animateToRegion() {},
  }));

  return (
    <View style={styles.mapBox}>
      <View style={styles.mapCanvas}>
        <View style={styles.gridLine} />
        <View style={[styles.gridLine, styles.gridLineVertical]} />
        <View style={styles.centerGlow} />
        <View style={styles.centerPin}>
          <Ionicons name="location" size={24} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.overlayTop}>
        <View style={styles.pill}>
          <Ionicons name="map-outline" size={12} color={FLEET_COLORS.primary} />
          <Text style={styles.pillText}>Interactive geofence preview</Text>
        </View>
        <Text style={styles.heroTitle}>Choose the center from the map area</Text>
        <Text style={styles.heroBody}>
          This build uses a stable preview so the app opens reliably on Android. The center and radius still save behind the scenes.
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
          onSelectCenter?.({
            latitude: DEFAULT_REGION.latitude,
            longitude: DEFAULT_REGION.longitude,
          });
        }}
      >
        <Ionicons name="locate" size={18} color={FLEET_COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 320,
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
  mapCanvas: {
    flex: 1,
    backgroundColor: '#11183A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridLineVertical: {
    top: 20,
    bottom: 20,
    left: '50%',
    right: undefined,
    width: 1,
    height: undefined,
  },
  centerGlow: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: FLEET_COLORS.primary + '22',
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '55',
  },
  centerPin: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: FLEET_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FLEET_COLORS.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
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
