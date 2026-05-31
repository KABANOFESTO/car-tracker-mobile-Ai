import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FLEET_COLORS } from '@/constants/theme';
import { TripPoint } from '@/constants/types';

interface Props {
  points: TripPoint[];
  activePoint: TripPoint | null;
}

export function TripReplayMap({ points, activePoint }: Props) {
  if (points.length === 0) {
    return null;
  }

  return (
    <View style={styles.mapCard}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Trip Path</Text>
        <Text style={styles.heroTitle}>Replay view ready</Text>
        <Text style={styles.heroBody}>
          This stable preview avoids native map crashes on Android while still showing your trip progress and breach moments.
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Points" value={String(points.length)} />
        <Metric label="Current" value={activePoint ? `${activePoint.latitude.toFixed(3)}, ${activePoint.longitude.toFixed(3)}` : 'N/A'} />
      </View>

      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Route summary</Text>
        <Text style={styles.timelineBody}>
          Use the controls below to replay the journey. The detailed coordinates and speeds are still available in the selected moment panel.
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    minHeight: 240,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
    padding: 14,
    gap: 12,
  },
  hero: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: FLEET_COLORS.primary + '12',
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '22',
    gap: 4,
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
    fontSize: 16,
    fontWeight: '800',
  },
  heroBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 4,
  },
  metricLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  timelineCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: FLEET_COLORS.background,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 4,
  },
  timelineTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  timelineBody: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
