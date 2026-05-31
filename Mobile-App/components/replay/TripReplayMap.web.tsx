import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { TripPoint } from '@/constants/types';

interface Props {
  points: TripPoint[];
  activePoint: TripPoint | null;
}

export function TripReplayMap({ points, activePoint }: Props) {
  return (
    <View style={styles.fallbackCard}>
      <Ionicons name="map-outline" size={22} color={FLEET_COLORS.primary} />
      <Text style={styles.fallbackText}>Replay map is available on iOS and Android.</Text>
      {activePoint ? (
        <Text style={styles.meta}>
          {points.length} points loaded. Active point at {activePoint.latitude.toFixed(5)}, {activePoint.longitude.toFixed(5)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    gap: 8,
    padding: 16,
  },
  fallbackText: { color: FLEET_COLORS.textSecondary, fontSize: 13 },
  meta: { color: FLEET_COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
});
