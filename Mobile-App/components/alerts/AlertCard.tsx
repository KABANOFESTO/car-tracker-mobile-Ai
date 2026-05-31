import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertEvent } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  alert: AlertEvent;
  onAcknowledge?: (alertId: string) => void;
}

function metaForAlert(alert: AlertEvent) {
  if (alert.severity === 'critical') {
    return { color: '#FF5D73', icon: 'alert-circle-outline' as const };
  }
  if (alert.severity === 'warning') {
    return { color: '#E8C547', icon: 'warning-outline' as const };
  }
  return { color: FLEET_COLORS.primary, icon: 'information-circle-outline' as const };
}

export function AlertCard({ alert, onAcknowledge }: Props) {
  const meta = metaForAlert(alert);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${meta.color}22` }]}>
          <Ionicons name={meta.icon} size={16} color={meta.color} />
        </View>
        <View style={styles.headline}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.subtitle}>
            {alert.vehicleName} • {new Date(alert.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.severityPill, { borderColor: `${meta.color}55` }]}>
          <Text style={[styles.severityText, { color: meta.color }]}>{alert.severity.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.description}>{alert.description}</Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{alert.category}</Text>
        {alert.relatedZoneName ? <Text style={styles.footerText}>Zone: {alert.relatedZoneName}</Text> : null}
        {alert.occurrenceCount && alert.occurrenceCount > 1 ? (
          <Text style={styles.footerText}>Seen {alert.occurrenceCount} times</Text>
        ) : null}
        {alert.notificationSentAt ? <Text style={styles.footerText}>Notified</Text> : null}
      </View>

      <View style={styles.actions}>
        <View style={[styles.statusPill, alert.acknowledged && styles.statusPillAcknowledged]}>
          <Text style={[styles.statusText, alert.acknowledged && styles.statusTextAcknowledged]}>
            {alert.acknowledged ? 'Acknowledged' : 'Open'}
          </Text>
        </View>
        {!alert.acknowledged ? (
          <TouchableOpacity style={styles.ackButton} onPress={() => onAcknowledge?.(alert.id)} activeOpacity={0.8}>
            <Ionicons name="checkmark-done-outline" size={14} color={FLEET_COLORS.primary} />
            <Text style={styles.ackButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
  },
  severityPill: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footerText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FF5D7322',
  },
  statusPillAcknowledged: {
    backgroundColor: FLEET_COLORS.green + '22',
  },
  statusText: {
    color: '#FFB7C3',
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextAcknowledged: {
    color: FLEET_COLORS.green,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: FLEET_COLORS.primary + '16',
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '55',
  },
  ackButtonText: {
    color: FLEET_COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
