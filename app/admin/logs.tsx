import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FLEET_COLORS } from '@/constants/theme';
import { fetchAdminAuditLogs, fetchAdminErrorLogs, fetchAdminRequestLogs } from '@/services/backendApiService';

type TabKey = 'requests' | 'audit' | 'errors';

export default function AdminLogsScreen() {
  const [tab, setTab] = useState<TabKey>('requests');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loaders = useMemo(() => ({
    requests: fetchAdminRequestLogs,
    audit: fetchAdminAuditLogs,
    errors: fetchAdminErrorLogs,
  }), []);

  async function load(activeTab = tab, isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await loaders[activeTab]();
      setItems(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        {(['requests', 'audit', 'errors'] as TabKey[]).map((entry) => (
          <TouchableOpacity
            key={entry}
            onPress={() => setTab(entry)}
            style={[styles.tab, tab === entry && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === entry && styles.tabTextActive]}>{entry}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(tab, true)} tintColor={FLEET_COLORS.primary} />}
      >
        {loading ? <ActivityIndicator color={FLEET_COLORS.primary} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error ? items.map((item, index) => (
          <View key={`${tab}-${index}`} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.action || item.path || item.source || 'Log entry'}
            </Text>
            <Text style={styles.cardMeta}>{item.actorEmail || item.method || item.severity || 'system'}</Text>
            <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  tabs: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
  },
  tabActive: {
    backgroundColor: FLEET_COLORS.primary + '22',
    borderColor: FLEET_COLORS.primary,
  },
  tabText: { color: FLEET_COLORS.textSecondary, textTransform: 'capitalize', fontWeight: '600' },
  tabTextActive: { color: FLEET_COLORS.primary },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  loading: { marginTop: 40 },
  error: { color: FLEET_COLORS.orange, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: FLEET_COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  cardMeta: { color: FLEET_COLORS.textSecondary, fontSize: 12 },
});
