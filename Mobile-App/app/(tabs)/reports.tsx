import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { MonthCalendar } from '@/components/reports/MonthCalendar';
import { StatsCard } from '@/components/reports/StatsCard';
import { FeedSummaryCard } from '@/components/reports/FeedSummaryCard';
import { DriverInsightCard } from '@/components/reports/DriverInsightCard';
import { useFeedHistory } from '@/hooks/useFeedHistory';
import { FLEET_COLORS } from '@/constants/theme';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ReportsScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { summaries, driverInsights, stats, loading } = useFeedHistory(null, year, month);

  const visible = useMemo(
    () => (selectedDay ? summaries.filter((summary) => Number(summary.date.split('-')[2]) === selectedDay) : summaries),
    [selectedDay, summaries]
  );
  const daysWithData = summaries.map((summary) => Number(summary.date.split('-')[2]));
  const highestRiskDriver = driverInsights[0] ?? null;

  function prevMonth() {
    if (month === 1) {
      setYear((current) => current - 1);
      setMonth(12);
    } else {
      setMonth((current) => current - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 12) {
      setYear((current) => current + 1);
      setMonth(1);
    } else {
      setMonth((current) => current + 1);
    }
    setSelectedDay(null);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Operational Reports</Text>
            <Text style={styles.subtitle}>Route replay, driver performance, and export-ready fleet history</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => router.push('/alerts' as never)}>
            <Ionicons name="notifications-outline" size={18} color={FLEET_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={FLEET_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={FLEET_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <MonthCalendar
          year={year}
          month={month}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay(day === selectedDay ? null : day)}
          daysWithData={daysWithData}
        />

        <View style={styles.statsRow}>
          <StatsCard
            title="Total Distance"
            value={stats.totalDistanceKm.toLocaleString()}
            unit="km"
            change={stats.distanceChange}
            icon="navigate-outline"
          />
          <StatsCard
            title="Peak Speed"
            value={stats.maxSpeedKmh.toString()}
            unit="km/h"
            change={0}
            icon="speedometer-outline"
          />
        </View>

        {highestRiskDriver ? (
          <View style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <View>
                <Text style={styles.highlightTitle}>Highest Risk Driver</Text>
                <Text style={styles.highlightSubtitle}>{highestRiskDriver.driverName} • {highestRiskDriver.vehicleName}</Text>
              </View>
              <View style={styles.highlightBadge}>
                <Text style={styles.highlightBadgeText}>{highestRiskDriver.riskScore}/100</Text>
              </View>
            </View>
            <Text style={styles.highlightBody}>
              {highestRiskDriver.geofenceBreaches} breach events, {highestRiskDriver.overspeedEvents} overspeed moments, and {highestRiskDriver.nightTrips} night trip{highestRiskDriver.nightTrips === 1 ? '' : 's'} this month.
            </Text>
          </View>
        ) : null}

        {stats.fenceBreachDays > 0 && (
          <View style={styles.fenceAlert}>
            <Ionicons name="warning-outline" size={16} color={FLEET_COLORS.orange} />
            <Text style={styles.fenceAlertText}>
              {stats.fenceBreachDays} day{stats.fenceBreachDays !== 1 ? 's' : ''} with geofence breaches this month
            </Text>
          </View>
        )}

        <View style={styles.tripsHeader}>
          <View>
            <Text style={styles.tripsTitle}>Daily Replays</Text>
            <Text style={styles.tripsSubtitle}>
              {selectedDay
                ? `${visible.length} record${visible.length !== 1 ? 's' : ''} on the ${selectedDay}th`
                : `${summaries.length} day${summaries.length !== 1 ? 's' : ''} with data`}
            </Text>
          </View>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportBtn, { borderColor: FLEET_COLORS.primary }]}
              onPress={() =>
                router.push({
                  pathname: '/reports/export',
                  params: { year: String(year), month: String(month), format: 'csv' },
                } as never)
              }
            >
              <Ionicons name="download-outline" size={14} color={FLEET_COLORS.primary} />
              <Text style={[styles.exportLabel, { color: FLEET_COLORS.primary }]}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportBtn, { borderColor: FLEET_COLORS.green }]}
              onPress={() =>
                router.push({
                  pathname: '/reports/export',
                  params: { year: String(year), month: String(month), format: 'pdf' },
                } as never)
              }
            >
              <Ionicons name="document-text-outline" size={14} color={FLEET_COLORS.green} />
              <Text style={[styles.exportLabel, { color: FLEET_COLORS.green }]}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <Text style={styles.loading}>Loading data...</Text>
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={40} color={FLEET_COLORS.border} />
            <Text style={styles.emptyText}>No data for this period</Text>
          </View>
        ) : (
          visible.map((summary) => (
            <FeedSummaryCard
              key={summary.id}
              summary={summary}
              onPress={() =>
                router.push({
                  pathname: '/trips/[vehicleId]',
                  params: { vehicleId: summary.vehicleId, date: summary.date },
                } as never)
              }
            />
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Driver Performance Insights</Text>
          <Text style={styles.sectionSubtitle}>Distance, risk score, overspeeding, and night movement patterns</Text>
        </View>

        {driverInsights.length === 0 && !loading ? (
          <Text style={styles.loading}>No driver insights available yet.</Text>
        ) : (
          driverInsights.map((insight) => <DriverInsightCard key={insight.vehicleId} insight={insight} />)
        )}
      </ScrollView>
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
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 4, maxWidth: 250 },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: FLEET_COLORS.surface,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { color: FLEET_COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  navBtn: {
    width: 40,
    height: 40,
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  highlightCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '55',
    padding: 14,
    gap: 8,
  },
  highlightHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  highlightTitle: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  highlightSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 3 },
  highlightBadge: {
    alignSelf: 'flex-start',
    backgroundColor: FLEET_COLORS.primary + '22',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  highlightBadgeText: { color: FLEET_COLORS.primary, fontSize: 12, fontWeight: '700' },
  highlightBody: { color: FLEET_COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  fenceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FLEET_COLORS.orange + '22',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: FLEET_COLORS.orange + '44',
  },
  fenceAlertText: { color: FLEET_COLORS.orange, fontSize: 13, flex: 1 },
  tripsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  tripsTitle: { color: FLEET_COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  tripsSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  exportButtons: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  exportLabel: { fontSize: 12, fontWeight: '600' },
  loading: { color: FLEET_COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  empty: { alignItems: 'center', gap: 8, marginTop: 32 },
  emptyText: { color: FLEET_COLORS.textSecondary, fontSize: 14 },
  sectionHeader: { gap: 4, marginTop: 8 },
  sectionTitle: { color: FLEET_COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12 },
});



