import { VehicleIntelligenceInsight } from '@/constants/types';
import { buildFleetIntelligence } from '@/services/intelligenceService';
import { getGeofenceZones, getProtectionStates } from '@/services/geofenceZoneService';
import { useEffect, useState } from 'react';
import { useVehicles } from './useVehicles';

export function useFleetIntelligence() {
  const { vehicles } = useVehicles();
  const [insights, setInsights] = useState<VehicleIntelligenceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [zones, protectionStates] = await Promise.all([getGeofenceZones(), getProtectionStates()]);
        const next = await buildFleetIntelligence(vehicles, zones, protectionStates);
        if (cancelled) return;
        setInsights(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to build fleet intelligence');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vehicles]);

  return { insights, loading, error };
}
