import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { GeofenceZone, Vehicle, VehicleProtectionState } from '@/constants/types';

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, '') ?? '';

function canSync() {
  return BACKEND_BASE_URL.length > 0;
}

async function postJson(path: string, body: unknown) {
  if (!canSync()) return null;
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Backend sync failed: ${response.status}`);
  }
  return response.json().catch(() => null);
}

export async function syncBackendState(
  vehicles: Vehicle[],
  zones: GeofenceZone[],
  protectionStates: VehicleProtectionState[]
) {
  if (!canSync()) return;

  await postJson('/api/sync-state', {
    vehicles,
    zones,
    protectionStates,
    syncedAt: new Date().toISOString(),
  });
}

export async function registerBackendPushToken() {
  if (!canSync() || Platform.OS === 'web') return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  await postJson('/api/register-push-token', {
    token: token.data,
    platform: Platform.OS,
    projectId,
    registeredAt: new Date().toISOString(),
  });
}
