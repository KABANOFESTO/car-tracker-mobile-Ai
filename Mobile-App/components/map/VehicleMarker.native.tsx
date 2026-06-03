import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FLEET_COLORS } from '@/constants/theme';
import { Vehicle } from '@/constants/types';

interface Props {
  vehicle: Vehicle;
  selected?: boolean;
}

export function VehicleMarker({ vehicle, selected = false }: Props) {
  const color = vehicle.isOutsideFence
    ? FLEET_COLORS.orange
    : vehicle.status === 'moving'
      ? FLEET_COLORS.green
      : vehicle.status === 'idle'
        ? '#F7B955'
        : FLEET_COLORS.textSecondary;

  return (
    <View style={[styles.outer, selected && styles.outerSelected]}>
      <View style={[styles.pointer, { borderTopColor: color }]} />
      <View style={[styles.card, { borderColor: color }, selected && styles.cardSelected]}>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
            <Ionicons name="car-sport" size={12} color={color} />
          </View>
          <View style={styles.meta}>
            <Text style={styles.name} numberOfLines={1}>
              {vehicle.name}
            </Text>
            <Text style={[styles.status, { color }]} numberOfLines={1}>
              {vehicle.status === 'moving' ? `${Math.round(vehicle.speed)} km/h` : vehicle.status}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -4 }],
  },
  outerSelected: {
    transform: [{ translateY: -6 }, { scale: 1.05 }],
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  card: {
    minWidth: 108,
    maxWidth: 150,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#11183A',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardSelected: {
    shadowOpacity: 0.36,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
