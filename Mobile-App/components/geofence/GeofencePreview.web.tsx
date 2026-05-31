import { Ionicons } from '@expo/vector-icons';
import React, { RefObject } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  mapRef: RefObject<any>;
  latitude: number;
  longitude: number;
  radius: number;
  onSelectCenter?: (coords: { latitude: number; longitude: number }) => void;
}

export function GeofencePreview({ latitude, longitude, radius }: Props) {
  const hasCenter = latitude !== 0 && longitude !== 0;

  return (
    <View style={styles.card}>
      <View style={styles.iconRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="map-outline" size={18} color={FLEET_COLORS.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Map selection is active on mobile</Text>
          <Text style={styles.body}>
            The current geofence center is stored behind the scenes. Open the mobile app to tap the map and place the center precisely.
          </Text>
        </View>
      </View>
      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>Selected center</Text>
        <Text style={styles.metaValue}>
          {hasCenter ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : 'No center selected yet'}
        </Text>
        <Text style={styles.metaLabel}>Radius</Text>
        <Text style={styles.metaValue}>{Math.round(radius)} m</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
    padding: 16,
  },
  iconRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: FLEET_COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 4 },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  body: { color: FLEET_COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  metaCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.background,
    padding: 14,
    gap: 4,
  },
  metaLabel: { color: FLEET_COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  metaValue: { color: FLEET_COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
});
