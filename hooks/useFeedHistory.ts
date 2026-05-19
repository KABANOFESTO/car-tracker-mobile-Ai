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
