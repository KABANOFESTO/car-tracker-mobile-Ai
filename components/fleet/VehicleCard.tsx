import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  vehicle: Vehicle;
  onFocusMap?: (vehicle: Vehicle) => void;
  onOpenDetails?: (vehicle: Vehicle) => void;
}

function statusColor(status: Vehicle['status']): string {
  switch (status) {
    case 'moving': return FLEET_COLORS.green;
    case 'idle': return FLEET_COLORS.orange;
    case 'offline': return FLEET_COLORS.textSecondary;
  }
}

function statusLabel(status: Vehicle['status']): string {
  switch (status) {
    case 'moving': return 'Moving';
    case 'idle': return 'Idle';
    case 'offline': return 'Offline';
  }
}

function hdopLabel(hdop: number): string {
  if (hdop < 2) return 'Excellent';
  if (hdop < 5) return 'Good';
  return 'Poor';
}

function vehicleIcon(type: string): 'car-outline' | 'bus-outline' | 'bicycle-outline' | 'cube-outline' {
  switch (type.toLowerCase()) {
    case 'motorcycle': return 'bicycle-outline';
    case 'truck': return 'cube-outline';
    case 'van': return 'bus-outline';
    default: return 'car-outline';
  }
}

export function VehicleCard({ vehicle, onFocusMap, onOpenDetails }: Props) {
  const color = statusColor(vehicle.status);
  const isLive = vehicle.status !== 'offline';
  const hasLocation = vehicle.location.latitude !== 0 || vehicle.location.longitude !== 0;

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
        <Ionicons name={vehicleIcon(vehicle.type)} size={20} color={color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <Text style={styles.plate}>{vehicle.licensePlate}</Text>
        {vehicle.driver && <Text style={styles.driver}>{vehicle.driver}</Text>}
        {isLive && (
          <View style={styles.telemetryRow}>
            <Ionicons name="radio-outline" size={10} color={FLEET_COLORS.textSecondary} />
            <Text style={styles.telemetryText}>{vehicle.satellites} sat</Text>
            <Text style={styles.telemetryDot}>·</Text>
            <Text style={styles.telemetryText}>{hdopLabel(vehicle.hdop)}</Text>
            {vehicle.status === 'moving' && (
              <>
                <Text style={styles.telemetryDot}>·</Text>
                <Ionicons name="compass-outline" size={10} color={FLEET_COLORS.textSecondary} />
                <Text style={styles.telemetryText}>{Math.round(vehicle.direction)}°</Text>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.right}>
        {/* Status + fence */}
        <View style={styles.statusGroup}>
          {vehicle.isOutsideFence && (
            <View style={styles.fenceBadge}>
              <Ionicons name="warning-outline" size={9} color="#fff" />
              <Text style={styles.fenceBadgeText}>FENCE</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{statusLabel(vehicle.status)}</Text>
          </View>
          {vehicle.status === 'moving' && (
            <Text style={styles.speed}>{Math.round(vehicle.speed)} km/h</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, !hasLocation && styles.actionBtnDisabled]}
            onPress={() => hasLocation && onFocusMap?.(vehicle)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons
              name="location-outline"
              size={16}
              color={hasLocation ? FLEET_COLORS.primary : FLEET_COLORS.border}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onOpenDetails?.(vehicle)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Ionicons name="create-outline" size={16} color={FLEET_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  plate: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  driver: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  telemetryText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
  },
  telemetryDot: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusGroup: {
    alignItems: 'flex-end',
    gap: 3,
  },
  fenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: FLEET_COLORS.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  fenceBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  speed: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 2,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: FLEET_COLORS.surface,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
});
