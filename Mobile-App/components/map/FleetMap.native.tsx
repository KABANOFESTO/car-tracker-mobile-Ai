import { FLEET_COLORS } from '@/constants/theme';
import { GeofenceConfig, Vehicle } from '@/constants/types';
import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

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
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Live Map</Text>
        <Text style={styles.heroTitle}>Fleet overview is ready</Text>
        <Text style={styles.heroBody}>
          The safe mode view is active on this build so the app opens reliably on every Android phone.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{vehicles.length}</Text>
          <Text style={styles.statLabel}>Tracked vehicles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{vehicles.filter((v) => v.status === 'moving').length}</Text>
          <Text style={styles.statLabel}>Moving now</Text>
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>What changed</Text>
        <Text style={styles.noteBody}>
          We paused the native map renderer for stability. Your vehicle data, reports, geofence settings, and backend sync still work.
        </Text>
      </View>
    </View>
  );
});

FleetMap.displayName = 'FleetMap';

const styles = StyleSheet.create({
  webFallback: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background,
    padding: 16,
    gap: 14,
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: FLEET_COLORS.surface,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 6,
  },
  heroLabel: {
    color: FLEET_COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  heroBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: FLEET_COLORS.surface,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 4,
  },
  statValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  noteCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: FLEET_COLORS.primary + '10',
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '25',
    gap: 6,
  },
  noteTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  noteBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
