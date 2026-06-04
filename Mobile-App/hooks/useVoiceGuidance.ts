import { useCallback, useEffect, useState } from 'react';
import {
  announceAlertVoice,
  announceMapCenter,
  announceReplayPoint,
  announceVehicleFocus,
  announceVehicleStatus,
  getVoiceGuidanceEnabled,
  setVoiceGuidanceEnabled,
  stopVoiceGuidance,
} from '@/services/voiceAssistantService';

export function useVoiceGuidance() {
  const [enabled, setEnabledState] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getVoiceGuidanceEnabled()
      .then((next) => {
        if (!cancelled) setEnabledState(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    setEnabledState(next);
    await setVoiceGuidanceEnabled(next);
    if (!next) {
      await stopVoiceGuidance();
    }
  }, []);

  return {
    enabled,
    loading,
    setEnabled,
    announceAlertVoice,
    announceMapCenter,
    announceReplayPoint,
    announceVehicleFocus,
    announceVehicleStatus,
    stopVoiceGuidance,
  };
}
