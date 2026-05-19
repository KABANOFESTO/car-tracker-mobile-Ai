import React from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FLEET_COLORS } from '@/constants/theme';
import { useFleetIntelligence } from '@/hooks/useFleetIntelligence';
import { InsightCard } from '@/components/intelligence/InsightCard';

export default function IntelligenceScreen() {
  const { insights, loading, error } = useFleetIntelligence();

  const highRisk = insights.filter((insight) => insight.tripRiskScore >= 70).length;
  const predictive = insights.filter((insight) => insight.predictiveAlert).length;
  const fleetAverageRisk =
    insights.length > 0
      ? Math.round(insights.reduce((sum, insight) => sum + insight.tripRiskScore, 0) / insights.length)
      : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Fleet Intelligence</Text>
            <Text style={styles.subtitle}>Autonomous monitoring, prediction, and decision support</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles-outline" size={16} color={FLEET_COLORS.primary} />
            <Text style={styles.headerBadgeText}>AI</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewRow}>
          <OverviewCard label="Fleet risk" value={`${fleetAverageRisk}/100`} accent={FLEET_COLORS.primary} />
          <OverviewCard label="High risk" value={String(highRisk)} accent="#FF5D73" />
          <OverviewCard label="Predictive alerts" value={String(predictive)} accent="#E8C547" />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>What the system is doing</Text>
          <Text style={styles.heroBody}>
            The intelligence layer is learning normal movement patterns, scoring trip risk, forecasting vehicle activity, and issuing owner recommendations based on live GPS, trip history, and zone behavior.
          </Text>
        </View>

        {loading ? <Text style={styles.message}>Building intelligence model...</Text> : null}
        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && insights.length === 0 ? (
          <Text style={styles.message}>No active vehicle data yet. Add a vehicle and wait for live telemetry.</Text>
        ) : null}

        {insights.map((insight) => (
          <InsightCard key={insight.vehicleId} insight={insight} />
        ))}
      </ScrollView>
    </View>
  );
}

function OverviewCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.overviewCard}>
      <View style={[styles.overviewAccent, { backgroundColor: accent }]} />
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FLEET_COLORS.background },
  safe: { backgroundColor: FLEET_COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
    gap: 12,
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 4, maxWidth: 260 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: FLEET_COLORS.primary + '18',
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '55',
  },
  headerBadgeText: { color: FLEET_COLORS.primary, fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  overviewRow: { flexDirection: 'row', gap: 10 },
  overviewCard: {
    flex: 1,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 12,
    gap: 6,
  },
  overviewAccent: { width: 28, height: 4, borderRadius: 2 },
  overviewValue: { color: FLEET_COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  overviewLabel: { color: FLEET_COLORS.textSecondary, fontSize: 11 },
  heroCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
    gap: 8,
  },
  heroTitle: { color: FLEET_COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  heroBody: { color: FLEET_COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  message: { color: FLEET_COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  error: { color: FLEET_COLORS.orange, textAlign: 'center', marginTop: 20 },
});
