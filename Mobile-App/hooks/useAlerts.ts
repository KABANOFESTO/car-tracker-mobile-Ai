import { AlertEvent, GeofenceZone, VehicleProtectionState } from '@/constants/types';
import { acknowledgeBackendIncident, backendIsConfigured, fetchBackendIncidents } from '@/services/backendApiService';
import { buildAlertEvents } from '@/services/alertService';
import { getGeofenceZones, getProtectionStates } from '@/services/geofenceZoneService';
import { acknowledgeIncident, mergeIncidentHistory } from '@/services/incidentHistoryService';
import { notifyForIncidents } from '@/services/notificationService';
import { useEffect, useState } from 'react';
import { useAuthSession } from './useAuthSession';
import { useVehicles } from './useVehicles';

export function useAlerts() {
  const { vehicles } = useVehicles();
  const { session } = useAuthSession();
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
        let merged: { history: AlertEvent[]; newAlerts: AlertEvent[] };

        if (backendIsConfigured() && session?.accessToken) {
          const remote = await fetchBackendIncidents({ limit: 100 });
          const normalized = remote.items.map((alert) => ({
            ...alert,
            timestamp: String(alert.timestamp),
            firstSeenAt: alert.firstSeenAt ? String(alert.firstSeenAt) : undefined,
            lastSeenAt: alert.lastSeenAt ? String(alert.lastSeenAt) : undefined,
            notificationSentAt: alert.notificationSentAt ? String(alert.notificationSentAt) : null,
          }));
          merged = await mergeIncidentHistory(normalized);
        } else {
          const built = await buildAlertEvents(vehicles, loadedProtection, loadedZones);
          merged = await mergeIncidentHistory(built);
          await notifyForIncidents(merged.newAlerts);
        }

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
  }, [session?.accessToken, vehicles]);

  async function acknowledge(alertId: string) {
    if (backendIsConfigured() && session?.accessToken) {
      await acknowledgeBackendIncident(alertId);
    }
    const next = await acknowledgeIncident(alertId);
    setAlerts(next);
  }

  return { alerts, zones, protectionStates, loading, error, acknowledge };
}
