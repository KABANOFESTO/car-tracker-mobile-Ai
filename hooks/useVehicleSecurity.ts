import { GeofenceZone, VehicleProtectionState } from '@/constants/types';
import {
  deleteVehicleZone,
  getVehicleProtectionState,
  getVehicleZones,
  saveVehicleZone,
  setVehicleProtectionState,
} from '@/services/geofenceZoneService';
import { useCallback, useEffect, useState } from 'react';

export function useVehicleSecurity(vehicleId: string | null) {
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [protectionState, setProtectionState] = useState<VehicleProtectionState | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!vehicleId) {
      setZones([]);
      setProtectionState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [loadedZones, loadedProtection] = await Promise.all([
      getVehicleZones(vehicleId),
      getVehicleProtectionState(vehicleId),
    ]);
    setZones(loadedZones);
    setProtectionState(loadedProtection);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveZone = useCallback(
    async (zone: Omit<GeofenceZone, 'id'> & { id?: string }) => {
      await saveVehicleZone(zone);
      await reload();
    },
    [reload]
  );

  const removeZone = useCallback(
    async (zoneId: string) => {
      await deleteVehicleZone(zoneId);
      await reload();
    },
    [reload]
  );

  const setProtection = useCallback(
    async (armed: boolean) => {
      if (!vehicleId) return;
      await setVehicleProtectionState(vehicleId, armed);
      await reload();
    },
    [reload, vehicleId]
  );

  return { zones, protectionState, loading, saveZone, removeZone, setProtection, reload };
}
