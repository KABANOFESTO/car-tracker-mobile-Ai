import { getGeofenceZones, getProtectionStates } from '@/services/geofenceZoneService';
import { registerBackendPushToken, syncBackendState } from '@/services/backendSyncService';
import { useEffect } from 'react';
import { useVehicles } from './useVehicles';
import { useAuthSession } from './useAuthSession';
import { setBackendSyncStatus } from '@/services/backendRuntimeService';

export function useBackendSync() {
  const { vehicles } = useVehicles();
  const { session, backendConfigured } = useAuthSession();

  useEffect(() => {
    let cancelled = false;

    setBackendSyncStatus({
      enabled: backendConfigured,
      authenticated: Boolean(session?.accessToken),
      isSyncing: false,
      lastError: null,
    });

    if (!backendConfigured || !session?.accessToken) {
      return () => {
        cancelled = true;
      };
    }

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
  }, [backendConfigured, session?.accessToken, vehicles]);
}
