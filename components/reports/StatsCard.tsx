import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  title: string;
  value: string;
  unit: string;
  change: number; // percent, positive = up, negative = down
  icon: 'speedometer-outline' | 'flame-outline' | 'navigate-outline';
}

export function StatsCard({ title, value, unit, change, icon }: Props) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? FLEET_COLORS.green : FLEET_COLORS.orange;
  const changeIcon = isPositive ? 'trending-up' : 'trending-down';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color={FLEET_COLORS.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <View style={styles.footer}>
        <Ionicons name={changeIcon as any} size={14} color={changeColor} />
        <Text style={[styles.changeText, { color: changeColor }]}>
          {isPositive ? '+' : ''}{change}% vs last month
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: FLEET_COLORS.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  unit: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
