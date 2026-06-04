import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedSummary } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  summary: FeedSummary;
  onPress?: (summary: FeedSummary) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function FeedSummaryCard({ summary, onPress }: Props) {
  const date = new Date(summary.date + 'T00:00:00');
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum = date.getDate();

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(summary)} activeOpacity={0.85}>
      <View style={styles.dateBox}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dayNum}>{dayNum}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.vehicleName}>{summary.vehicleName}</Text>
          {summary.fenceBreachCount > 0 && (
            <View style={styles.fenceBadge}>
              <Ionicons name="warning-outline" size={10} color="#fff" />
              <Text style={styles.fenceBadgeText}>{summary.fenceBreachCount} breach</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="navigate-outline" size={12} color={FLEET_COLORS.primary} />
            <Text style={styles.statValue}>{summary.estimatedDistanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="pulse-outline" size={12} color={FLEET_COLORS.primary} />
            <Text style={styles.statValue}>{summary.averageSpeedKmh.toFixed(1)} km/h avg</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="speedometer-outline" size={12} color={FLEET_COLORS.primary} />
            <Text style={styles.statValue}>{summary.maxSpeed} km/h</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={12} color={FLEET_COLORS.textSecondary} />
            <Text style={styles.statValueMuted}>{summary.durationMinutes} min</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="radio-outline" size={12} color={FLEET_COLORS.textSecondary} />
            <Text style={styles.statValueMuted}>{summary.entryCount} pings</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Open trip replay</Text>
          <Ionicons name="arrow-forward" size={14} color={FLEET_COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  dateBox: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FLEET_COLORS.primary + '22',
    borderRadius: 8,
    paddingVertical: 6,
  },
  dayName: {
    color: FLEET_COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayNum: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  footerText: {
    color: FLEET_COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleName: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
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
    fontSize: 9,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  statValueMuted: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
});
