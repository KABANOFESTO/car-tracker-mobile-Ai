import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { Vehicle } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
}

function markerColor(vehicle: Vehicle): string {
  if (vehicle.isOutsideFence) return FLEET_COLORS.orange;
  switch (vehicle.status) {
    case 'moving': return FLEET_COLORS.green;
    case 'idle': return FLEET_COLORS.orange;
    case 'offline': return FLEET_COLORS.textSecondary;
  }
}

export function VehicleMarker({ vehicle, onPress }: Props) {
  const color = markerColor(vehicle);

  return (
    <Marker
      key={vehicle.id}
      coordinate={vehicle.location}
      onPress={() => onPress?.(vehicle)}
      tracksViewChanges={false}
    >
      <View style={[styles.markerContainer, { borderColor: color }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        {vehicle.isOutsideFence && (
          <Ionicons name="warning-outline" size={10} color={FLEET_COLORS.orange} />
        )}
        <Text style={styles.label} numberOfLines={1}>{vehicle.name}</Text>
      </View>
    </Marker>
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
