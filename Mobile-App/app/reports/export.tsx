import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FLEET_COLORS } from '@/constants/theme';
import { useFeedHistory } from '@/hooks/useFeedHistory';
import {
  buildReportCsv,
  buildReportPdfHtml,
  createReportFileName,
  formatReportPeriod,
  ReportExportFormat,
} from '@/services/reportExportService';

export default function ReportExportScreen() {
  const { year, month, vehicleId, format } = useLocalSearchParams<{
    year: string;
    month: string;
    vehicleId?: string;
    format?: string;
  }>();

  const exportFormat: ReportExportFormat = format === 'pdf' ? 'pdf' : 'csv';
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const periodLabel = useMemo(() => formatReportPeriod(parsedYear, parsedMonth), [parsedMonth, parsedYear]);
  const hasStarted = useRef(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [details, setDetails] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');

  const { summaries, driverInsights, stats, loading, error } = useFeedHistory(vehicleId ?? null, parsedYear, parsedMonth);

  useEffect(() => {
    if (hasStarted.current || loading || error) return;

    let cancelled = false;
    hasStarted.current = true;

    async function run() {
      try {
        setStatus('working');
        const scopeLabel = vehicleId ? 'Selected vehicle' : 'Fleet';
        const nextFileName = createReportFileName(exportFormat, parsedYear, parsedMonth, vehicleId ?? 'fleet');
        setFileName(nextFileName);

        if (exportFormat === 'csv') {
          const csv = buildReportCsv({ summaries, periodLabel, scopeLabel });
          if (Platform.OS === 'web') {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            setFileUri(url);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = nextFileName;
            anchor.style.display = 'none';
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
          } else {
            const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ''}${nextFileName}`;
            await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
            setFileUri(uri);

            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(uri, {
                mimeType: 'text/csv',
                dialogTitle: 'Share FleetPulse CSV report',
              });
            }
          }
        } else {
          const html = buildReportPdfHtml({
            summaries,
            driverInsights,
            stats,
            periodLabel,
            scopeLabel,
            vehicleLabel: vehicleId ? 'selected vehicle' : 'the fleet',
          });

          if (Platform.OS === 'web') {
            await Print.printAsync({ html });
          } else {
            const result = await Print.printToFileAsync({ html });
            setFileUri(result.uri);

            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(result.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Share FleetPulse PDF report',
              });
            }
          }
        }

        if (!cancelled) {
          setStatus('done');
          setDetails(`Your ${exportFormat.toUpperCase()} report is ready.`);
        }
      } catch (exportError) {
        if (!cancelled) {
          setStatus('error');
          setDetails(exportError instanceof Error ? exportError.message : 'Failed to generate export');
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [driverInsights, error, exportFormat, loading, parsedMonth, parsedYear, periodLabel, summaries, stats, vehicleId]);

  const title = exportFormat === 'pdf' ? 'PDF Export' : 'CSV Export';
  const subtitle =
    exportFormat === 'pdf'
      ? 'Professional printable summary with driver insights and route totals.'
      : 'Clean CSV download generated directly from the selected ThingSpeak history.';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={18} color={FLEET_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={exportFormat === 'pdf' ? 'document-text-outline' : 'download-outline'}
              size={22}
              color={FLEET_COLORS.primary}
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{periodLabel}</Text>
            <Text style={styles.heroSubtitle}>
              {vehicleId ? 'Selected vehicle export' : 'Fleet-wide export'} - {summaries.length} summary record
              {summaries.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {status === 'working' || loading ? (
          <View style={styles.center}>
            <Ionicons name="reload-outline" size={20} color={FLEET_COLORS.primary} />
            <Text style={styles.message}>Preparing your {exportFormat.toUpperCase()} file...</Text>
          </View>
        ) : status === 'error' ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={FLEET_COLORS.orange} />
            <Text style={styles.errorText}>{details || error || 'Failed to generate export.'}</Text>
          </View>
        ) : (
          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={FLEET_COLORS.green} />
              <Text style={styles.successText}>Export complete</Text>
            </View>
            <Text style={styles.successBody}>
              {fileName ? `Saved as ${fileName}` : 'Your file has been generated successfully.'}
            </Text>
            {details ? <Text style={styles.successBody}>{details}</Text> : null}
          </View>
        )}

        <View style={styles.summaryGrid}>
          <MiniStat label="Distance" value={`${stats.totalDistanceKm.toFixed(1)} km`} />
          <MiniStat label="Peak Speed" value={`${stats.maxSpeedKmh.toFixed(1)} km/h`} />
          <MiniStat label="Active Days" value={String(stats.dayCount)} />
          <MiniStat label="Breach Days" value={String(stats.fenceBreachDays)} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Back to reports</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' ? null : (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={async () => {
                if (!fileUri) return;
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: exportFormat === 'pdf' ? 'application/pdf' : 'text/csv',
                    dialogTitle: `Share FleetPulse ${exportFormat.toUpperCase()} report`,
                  });
                } else {
                  Alert.alert('Sharing unavailable', 'Your device does not support the share sheet.');
                }
              }}
            >
              <Text style={styles.shareBtnText}>Share again</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={FLEET_COLORS.primary} />
          <Text style={styles.noteText}>
            This export is built from live ThingSpeak history and can be shared with owners or archived for reporting.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
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
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: FLEET_COLORS.border,
    gap: 12,
  },
  title: { color: FLEET_COLORS.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, marginTop: 4, maxWidth: 280 },
  closeBtn: {
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
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  hero: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '33',
    backgroundColor: FLEET_COLORS.primary + '12',
    padding: 16,
    alignItems: 'center',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: FLEET_COLORS.surface,
    borderWidth: 1,
    borderColor: FLEET_COLORS.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { color: FLEET_COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  heroSubtitle: { color: FLEET_COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
  },
  message: { color: FLEET_COLORS.textSecondary, textAlign: 'center' },
  errorCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.orange + '44',
    backgroundColor: FLEET_COLORS.orange + '12',
    padding: 14,
  },
  errorText: { color: FLEET_COLORS.orange, flex: 1, fontSize: 13, lineHeight: 18 },
  successCard: {
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.green + '44',
    backgroundColor: FLEET_COLORS.green + '12',
    padding: 14,
  },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  successText: { color: FLEET_COLORS.green, fontSize: 15, fontWeight: '700' },
  successBody: { color: FLEET_COLORS.textSecondary, fontSize: 13, lineHeight: 18 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniStat: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
    padding: 14,
    gap: 4,
  },
  miniStatLabel: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  miniStatValue: { color: FLEET_COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: { color: FLEET_COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  shareBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: FLEET_COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  noteCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    backgroundColor: FLEET_COLORS.surface,
  },
  noteText: { flex: 1, color: FLEET_COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
});
