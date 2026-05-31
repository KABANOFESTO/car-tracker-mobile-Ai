import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FLEET_COLORS } from '@/constants/theme';
import { Vehicle } from '@/constants/types';

interface Props {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
}

export function VehicleMarker({ vehicle }: Props) {
  const color = vehicle.isOutsideFence
    ? FLEET_COLORS.orange
    : vehicle.status === 'moving'
      ? FLEET_COLORS.green
      : vehicle.status === 'idle'
        ? FLEET_COLORS.orange
        : FLEET_COLORS.textSecondary;

  return (
    <View style={[styles.markerContainer, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label} numberOfLines={1}>
        {vehicle.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 3,
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 80,
  },
});
