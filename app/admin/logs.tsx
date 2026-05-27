import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { fetchAdminAuditLogs, fetchAdminErrorLogs, fetchAdminRequestLogs } from '@/services/backendApiService';

type TabKey = 'requests' | 'audit' | 'errors';

const TAB_META: Record<TabKey, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  requests: { label: 'Requests', icon: 'swap-horizontal-outline' },
  audit: { label: 'Audit Trail', icon: 'document-text-outline' },
  errors: { label: 'Errors', icon: 'alert-circle-outline' },
};

function getLogHeadline(item: any) {
  return item.action || item.path || item.source || item.message || 'Log entry';
}

function getLogSubline(item: any) {
  return item.actorEmail || item.method || item.severity || item.statusCode || 'system';
}

export default function AdminLogsScreen() {
  const { user } = useAuthSession();
  const { preferences, accent } = useProfilePreferences(user?.id);
  const [tab, setTab] = useState<TabKey>('requests');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loaders = useMemo(
    () => ({
      requests: fetchAdminRequestLogs,
      audit: fetchAdminAuditLogs,
      errors: fetchAdminErrorLogs,
    }),
    []
  );

  const load = useCallback(async (activeTab: TabKey, isRefresh = false) => {
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
  }, [loaders]);

  useEffect(() => {
    load(tab);
  }, [load, tab]);

  const topSummary = useMemo(() => {
    const latest = items[0];
    return {
      total: items.length,
      latestLabel: latest?.createdAt ? new Date(latest.createdAt).toLocaleString() : 'No activity yet',
    };
  }, [items]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(tab, true)} tintColor={accent.primary} />}
      >
        <View style={styles.heroCard}>
          <View style={[styles.heroGlow, { backgroundColor: accent.primary + '32' }]} />
          <View style={styles.heroTop}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>Admin Workspace</Text>
              <Text style={styles.heroTitle}>Operations Logs</Text>
              <Text style={styles.heroSubtitle}>
                Follow backend requests, audit actions, and error activity with a cleaner, more readable timeline.
              </Text>
            </View>
            <ProfileAvatar avatarId={preferences.avatarId} name={user?.name} size={58} />
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{topSummary.total}</Text>
              <Text style={styles.summaryLabel}>Visible entries</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{TAB_META[tab].label}</Text>
              <Text style={styles.summaryLabel}>Current stream</Text>
            </View>
          </View>

          <View style={styles.latestStrip}>
            <Ionicons name="time-outline" size={15} color={accent.secondary} />
            <Text style={styles.latestStripText}>Latest activity: {topSummary.latestLabel}</Text>
          </View>
        </View>

        <View style={styles.tabsWrap}>
          {(Object.keys(TAB_META) as TabKey[]).map((entry) => {
            const active = tab === entry;
            return (
              <TouchableOpacity
                key={entry}
                onPress={() => setTab(entry)}
                style={[styles.tab, active && { borderColor: accent.primary, backgroundColor: accent.primary + '15' }]}
              >
                <Ionicons name={TAB_META[entry].icon} size={15} color={active ? accent.primary : FLEET_COLORS.textSecondary} />
                <Text style={[styles.tabText, active && { color: accent.primary }]}>{TAB_META[entry].label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? <ActivityIndicator color={accent.primary} style={styles.loading} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error ? (
          <View style={styles.logList}>
            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="archive-outline" size={24} color={FLEET_COLORS.textSecondary} />
                <Text style={styles.emptyTitle}>No log entries yet</Text>
                <Text style={styles.emptySubtitle}>This stream will populate as the backend receives activity.</Text>
              </View>
            ) : (
              items.map((item, index) => (
                <View key={`${tab}-${index}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: accent.primary + '15', borderColor: accent.primary + '30' }]}>
                      <Ionicons name={TAB_META[tab].icon} size={15} color={accent.primary} />
                    </View>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle}>{getLogHeadline(item)}</Text>
                      <Text style={styles.cardMeta}>{getLogSubline(item)}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoPill}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.infoValue}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}</Text>
                    </View>
                    {item.statusCode ? (
                      <View style={styles.infoPill}>
                        <Text style={styles.infoLabel}>Status</Text>
                        <Text style={styles.infoValue}>{item.statusCode}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
                  {item.path ? <Text style={styles.metaLine}>Path: {item.path}</Text> : null}
                  {item.method ? <Text style={styles.metaLine}>Method: {item.method}</Text> : null}
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 18,
    gap: 16,
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroEyebrow: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 4,
    color: FLEET_COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 8,
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 260,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 4,
  },
  summaryValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
  },
  latestStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  latestStripText: {
    flex: 1,
    color: FLEET_COLORS.textSecondary,
    fontSize: 12.5,
  },
  tabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
  },
  tabText: { color: FLEET_COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  contentSpacer: { height: 8 },
  loading: { marginTop: 48 },
  error: { color: FLEET_COLORS.orange, textAlign: 'center', marginTop: 24 },
  logList: { gap: 12 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  cardMeta: { color: FLEET_COLORS.textSecondary, fontSize: 12.5 },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  infoPill: {
    minWidth: 120,
    backgroundColor: FLEET_COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  infoLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  message: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  metaLine: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12.5,
  },
});
