import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DriverInsight } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  insight: DriverInsight;
}

function riskColor(score: number) {
  if (score >= 70) return FLEET_COLORS.orange;
  if (score >= 40) return '#E8C547';
  return FLEET_COLORS.green;
}

export function DriverInsightCard({ insight }: Props) {
  const color = riskColor(insight.riskScore);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{insight.driverName}</Text>
          <Text style={styles.vehicle}>{insight.vehicleName}</Text>
        </View>
        <View style={[styles.riskPill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
          <Ionicons name="shield-checkmark-outline" size={13} color={color} />
          <Text style={[styles.riskText, { color }]}>{insight.riskScore}/100</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric label="Distance" value={`${insight.totalDistanceKm.toFixed(1)} km`} icon="navigate-outline" />
        <Metric label="Active" value={`${insight.activeMinutes} min`} icon="time-outline" />
        <Metric label="Avg Speed" value={`${insight.averageSpeedKmh.toFixed(1)} km/h`} icon="speedometer-outline" />
        <Metric label="Breaches" value={String(insight.geofenceBreaches)} icon="warning-outline" />
        <Metric label="Overspeed" value={String(insight.overspeedEvents)} icon="speedometer-outline" />
      </View>

      <Text style={styles.footer}>
        Idle estimate {insight.idleMinutesEstimate} min • {insight.nightTrips} night trip{insight.nightTrips === 1 ? '' : 's'}
      </Text>
    </View>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={13} color={FLEET_COLORS.textSecondary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  name: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  vehicle: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    minWidth: '47%',
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  metricLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
  },
  metricValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
});
