import { DriverInsight, FeedStats, FeedSummary } from '@/constants/types';
import { exportFeedHistoryCsv, getDriverInsights, getVehicleFeedHistory } from '@/services/tripService';
import { useEffect, useState } from 'react';

export type { FeedStats };

export function useFeedHistory(vehicleId: string | null, year: number, month: number) {
  const [summaries, setSummaries] = useState<FeedSummary[]>([]);
  const [driverInsights, setDriverInsights] = useState<DriverInsight[]>([]);
  const [stats, setStats] = useState<FeedStats>({
    totalDistanceKm: 0,
    maxSpeedKmh: 0,
    dayCount: 0,
    fenceBreachDays: 0,
    distanceChange: 0,
    averageDailyDistanceKm: 0,
    averageDailyEntries: 0,
    averageHdop: 0,
    activeVehicleCount: 0,
    breachRatePercent: 0,
    longestTripMinutes: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [current, previous, insights] = await Promise.all([
          getVehicleFeedHistory(vehicleId, year, month),
          getVehicleFeedHistory(vehicleId, month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1),
          getDriverInsights(year, month),
        ]);

        if (cancelled) return;

        setSummaries(current);
        setDriverInsights(insights);

        const totalDistanceKm = current.reduce((s, d) => s + d.estimatedDistanceKm, 0);
        const prevDistanceKm = previous.reduce((s, d) => s + d.estimatedDistanceKm, 0);
        const maxSpeedKmh = current.reduce((s, d) => Math.max(s, d.maxSpeed), 0);
        const fenceBreachDays = current.filter(d => d.fenceBreachCount > 0).length;
        const totalEntries = current.reduce((sum, summary) => sum + summary.entryCount, 0);
        const averageHdop = current.length > 0 ? current.reduce((sum, summary) => sum + summary.avgHdop, 0) / current.length : 0;
        const activeVehicleCount = new Set(current.map((summary) => summary.vehicleId)).size;
        const longestTripMinutes = current.reduce((longest, summary) => Math.max(longest, summary.durationMinutes), 0);
        const breachRatePercent = current.length > 0 ? Math.round((fenceBreachDays / current.length) * 100) : 0;
        const distanceChange =
          prevDistanceKm === 0
            ? 0
            : Math.round(((totalDistanceKm - prevDistanceKm) / prevDistanceKm) * 100);

        setStats({
          totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
          maxSpeedKmh: Math.round(maxSpeedKmh * 10) / 10,
          dayCount: current.length,
          fenceBreachDays,
          distanceChange,
          averageDailyDistanceKm: current.length > 0 ? Math.round((totalDistanceKm / current.length) * 10) / 10 : 0,
          averageDailyEntries: current.length > 0 ? Math.round((totalEntries / current.length) * 10) / 10 : 0,
          averageHdop: Math.round(averageHdop * 100) / 100,
          activeVehicleCount,
          breachRatePercent,
          longestTripMinutes,
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load feed history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [vehicleId, year, month]);

  async function exportCsv() {
    return exportFeedHistoryCsv(vehicleId, year, month);
  }

  return { summaries, driverInsights, stats, loading, error, exportCsv };
}
