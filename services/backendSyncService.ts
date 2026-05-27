import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { GeofenceZone, Vehicle, VehicleProtectionState } from '@/constants/types';
import { registerBackendPushToken as registerTokenRequest, syncBackendFleetState } from './backendApiService';
import { backendIsConfigured } from './backendConfigService';
import { setBackendSyncStatus } from './backendRuntimeService';

function canSync() {
  return backendIsConfigured();
}

export async function syncBackendState(
  vehicles: Vehicle[],
  zones: GeofenceZone[],
  protectionStates: VehicleProtectionState[]
) {
  setBackendSyncStatus({ enabled: canSync(), isSyncing: true, lastError: null });
  if (!canSync()) return;

  try {
    await syncBackendFleetState({
      vehicles,
      zones,
      protectionStates,
      syncedAt: new Date().toISOString(),
    });
    setBackendSyncStatus({
      enabled: true,
      authenticated: true,
      isSyncing: false,
      lastError: null,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error) {
    setBackendSyncStatus({
      enabled: true,
      authenticated: false,
      isSyncing: false,
      lastError: error instanceof Error ? error.message : 'Backend sync failed',
    });
    throw error;
  }
}

export async function registerBackendPushToken() {
  if (!canSync() || Platform.OS === 'web') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  await registerTokenRequest({
    token: token.data,
    platform: Platform.OS,
    projectId,
    registeredAt: new Date().toISOString(),
  });
}
