import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertCategory } from '@/constants/types';
import { FLEET_COLORS } from '@/constants/theme';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertCard } from '@/components/alerts/AlertCard';

type Filter = 'all' | AlertCategory;

const FILTERS: Filter[] = ['all', 'security', 'geofence', 'offline', 'driving'];

export default function AlertsScreen() {
  const { alerts, loading, error } = useAlerts();
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => alerts.filter((alert) => activeFilter === 'all' || alert.category === activeFilter),
    [activeFilter, alerts]
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Alert Center</Text>
            <Text style={styles.subtitle}>Operational events, security warnings, and geofence breaches</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="notifications-outline" size={16} color={FLEET_COLORS.primary} />
            <Text style={styles.badgeText}>{alerts.length}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.empty}>Loading alerts...</Text> : null}
        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && filtered.length === 0 ? (
          <Text style={styles.empty}>No alerts in this category.</Text>
        ) : null}
        {filtered.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 4, maxWidth: 260 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '55',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: FLEET_COLORS.primary + '18',
  },
  badgeText: { color: FLEET_COLORS.primary, fontSize: 12, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: FLEET_COLORS.surface,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
  },
  filterChipActive: {
    backgroundColor: FLEET_COLORS.primary + '22',
    borderColor: FLEET_COLORS.primary,
  },
  filterText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterTextActive: { color: FLEET_COLORS.primary },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  empty: { color: FLEET_COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  error: { color: FLEET_COLORS.orange, textAlign: 'center', marginTop: 24 },
});
