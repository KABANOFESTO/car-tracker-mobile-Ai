import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { FLEET_COLORS } from '@/constants/theme';
import { exportFeedHistoryCsv } from '@/services/tripService';

export default function ReportExportScreen() {
  const { year, month, vehicleId } = useLocalSearchParams<{ year: string; month: string; vehicleId?: string }>();
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await exportFeedHistoryCsv(vehicleId ?? null, Number(year), Number(month));
        if (!cancelled) setCsv(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to build export');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [month, vehicleId, year]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>CSV Export</Text>
          <Text style={styles.subtitle}>Structured report data ready for download or backend delivery</Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={FLEET_COLORS.primary} />
          <Text style={styles.message}>Preparing export...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.codeCard}>
            <Text style={styles.code}>{csv}</Text>
          </View>
        </ScrollView>
      )}
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
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  message: { color: FLEET_COLORS.textSecondary, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  codeCard: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    padding: 14,
  },
  code: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
});


