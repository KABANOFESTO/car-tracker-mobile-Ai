import { getGeofenceZones, getProtectionStates } from '@/services/geofenceZoneService';
import { registerBackendPushToken, syncBackendState } from '@/services/backendSyncService';
import { useEffect } from 'react';
import { useVehicles } from './useVehicles';

export function useBackendSync() {
  const { vehicles } = useVehicles();

  useEffect(() => {
    let cancelled = false;

    async function syncNow() {
      try {
        await registerBackendPushToken();
        const [zones, protectionStates] = await Promise.all([getGeofenceZones(), getProtectionStates()]);
        if (cancelled) return;
        await syncBackendState(vehicles, zones, protectionStates);
      } catch {
        // Backend sync is best-effort; the app should remain usable offline or without a dispatcher.
      }
    }

    syncNow();
    const interval = setInterval(syncNow, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [vehicles]);
}
