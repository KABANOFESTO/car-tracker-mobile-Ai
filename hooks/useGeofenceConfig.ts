import { useEffect, useState } from 'react';
import { GeofenceConfig } from '@/constants/types';
import { subscribeConfig, getGeofenceConfig, updateGeofenceConfig } from '@/services/configService';
import { setSpeedThreshold } from '@/services/thingspeakService';

export function useGeofenceConfig() {
  const [config, setConfig] = useState<GeofenceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'error' | 'loading'>('loading');

  useEffect(() => {
    // Subscribe to module-level config state — fires immediately if already cached,
    // so Fleet/Map tabs see the latest value without re-fetching.
    const unsub = subscribeConfig(cfg => {
      setConfig(cfg);
      setSpeedThreshold(cfg.speedThreshold);
      setLoading(false);
      setSyncStatus('synced');
    });

    // If no cached config yet, trigger the initial fetch
    if (!config) {
      setLoading(true);
      setSyncStatus('loading');
      getGeofenceConfig().catch(e => {
        const msg = e instanceof Error ? e.message : 'Failed to load geofence config';
        setError(msg);
        setSyncStatus('error');
        setLoading(false);
      });
    }

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(partial: Partial<GeofenceConfig>) {
    setSaving(true);
    setError(null);
    try {
      // updateGeofenceConfig broadcasts via notify() → subscribeConfig callbacks
      // → setConfig fires in every mounted useGeofenceConfig instance
      const updated = await updateGeofenceConfig(partial);
      setSyncStatus('synced');
      return updated;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save geofence config';
      setError(msg);
      setSyncStatus('error');
      throw e;
    } finally {
      setSaving(false);
    }
  }

  async function reload() {
    setLoading(true);
    setError(null);
    setSyncStatus('loading');
    try {
      await getGeofenceConfig(); // will notify() all subscribers
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load geofence config';
      setError(msg);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }

  return { config, loading, saving, error, syncStatus, save, reload };
}
