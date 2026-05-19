import { AlertEvent, GeofenceZone, VehicleProtectionState } from '@/constants/types';
import { buildAlertEvents } from '@/services/alertService';
import { getGeofenceZones, getProtectionStates } from '@/services/geofenceZoneService';
import { acknowledgeIncident, mergeIncidentHistory } from '@/services/incidentHistoryService';
import { notifyForIncidents } from '@/services/notificationService';
import { useEffect, useState } from 'react';
import { useVehicles } from './useVehicles';

export function useAlerts() {
  const { vehicles } = useVehicles();
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [protectionStates, setProtectionStates] = useState<VehicleProtectionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [loadedZones, loadedProtection] = await Promise.all([getGeofenceZones(), getProtectionStates()]);
        const built = await buildAlertEvents(vehicles, loadedProtection, loadedZones);
        const merged = await mergeIncidentHistory(built);
        await notifyForIncidents(merged.newAlerts);
        if (cancelled) return;
        setZones(loadedZones);
        setProtectionStates(loadedProtection);
        setAlerts(merged.history);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load alerts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [vehicles]);

  async function acknowledge(alertId: string) {
    const next = await acknowledgeIncident(alertId);
    setAlerts(next);
  }

  return { alerts, zones, protectionStates, loading, error, acknowledge };
}
