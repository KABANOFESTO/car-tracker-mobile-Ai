import { AlertEvent, AuthSession, AuthUser, BackendIncidentList } from '@/constants/types';
import { getStoredSession, persistSession } from './authSessionService';

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, '') ?? '';
const BACKEND_API_KEY = process.env.EXPO_PUBLIC_BACKEND_API_KEY ?? '';

type AuthMode = 'none' | 'jwt' | 'both';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  authMode?: AuthMode;
}

function hasBackendConfig() {
  return BACKEND_BASE_URL.length > 0;
}

export function backendIsConfigured() {
  return hasBackendConfig();
}

async function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  if (!hasBackendConfig()) return null;

  const response = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  if (!response.ok) {
    await persistSession(null);
    return null;
  }

  const data = await response.json();
  const nextSession: AuthSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
  await persistSession(nextSession);
  return nextSession;
}

async function requestJson<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  if (!hasBackendConfig()) {
    throw new Error('Backend is not configured');
  }

  const session = options.authMode && options.authMode !== 'none' ? await getStoredSession() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.authMode === 'both') {
    if (!BACKEND_API_KEY) throw new Error('Backend API key is missing');
    headers['x-mobile-api-key'] = BACKEND_API_KEY;
  }

  if ((options.authMode === 'jwt' || options.authMode === 'both') && session?.accessToken) {
    headers.authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && retry && session?.refreshToken && options.authMode !== 'none') {
    const refreshed = await refreshSession(session);
    if (refreshed) {
      return requestJson<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || `Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loginBackend(email: string, password: string): Promise<AuthSession> {
  const data = await requestJson<{ accessToken: string; refreshToken: string; user: AuthUser }>(
    '/api/auth/login',
    {
      method: 'POST',
      authMode: 'none',
      body: { email, password },
    }
  );

  const session: AuthSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
  await persistSession(session);
  return session;
}

export async function getBackendProfile(): Promise<AuthUser> {
  const data = await requestJson<{ ok: true; user: AuthUser }>('/api/auth/me', { authMode: 'jwt' });
  return data.user;
}

export async function logoutBackend(refreshToken?: string): Promise<void> {
  const session = await getStoredSession();
  if (session?.accessToken) {
    await requestJson('/api/auth/logout', {
      method: 'POST',
      authMode: 'jwt',
      body: { refreshToken: refreshToken ?? session.refreshToken },
    }).catch(() => undefined);
  }
  await persistSession(null);
}

export async function changeBackendPassword(currentPassword: string, newPassword: string): Promise<void> {
  await requestJson('/api/auth/change-password', {
    method: 'POST',
    authMode: 'jwt',
    body: { currentPassword, newPassword },
  });
}

export async function requestBackendPasswordReset(email: string): Promise<{ resetToken?: string }> {
  return requestJson('/api/auth/forgot-password', {
    method: 'POST',
    authMode: 'none',
    body: { email },
  });
}

export async function resetBackendPassword(resetToken: string, newPassword: string): Promise<void> {
  await requestJson('/api/auth/reset-password', {
    method: 'POST',
    authMode: 'none',
    body: { resetToken, newPassword },
  });
}

export async function fetchBackendIncidents(params: {
  page?: number;
  limit?: number;
  category?: string;
  severity?: string;
  vehicleId?: string;
  acknowledged?: boolean;
} = {}): Promise<BackendIncidentList> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) query.set(key, String(value));
  });

  return requestJson<BackendIncidentList>(`/api/incidents${query.size ? `?${query}` : ''}`, { authMode: 'jwt' });
}

export async function acknowledgeBackendIncident(incidentId: string): Promise<AlertEvent> {
  const data = await requestJson<{ ok: true; incident: AlertEvent }>(`/api/incidents/${incidentId}/acknowledge`, {
    method: 'PATCH',
    authMode: 'jwt',
  });
  return data.incident;
}

export async function fetchBackendFleetState(): Promise<{
  state:
    | {
        ownerUserId?: string;
        vehicles: Array<{
          id: string;
          name: string;
          channelId: number;
          readApiKey: string;
          type: string;
          licensePlate: string;
          driver?: string;
        }>;
        zones: Array<any>;
        protectionStates: Array<any>;
      }
    | Array<any>;
}> {
  return requestJson('/api/fleet-state', { authMode: 'jwt' });
}

export async function syncBackendFleetState(body: unknown) {
  return requestJson('/api/sync-state', {
    method: 'POST',
    authMode: 'both',
    body,
  });
}

export async function registerBackendPushToken(body: unknown) {
  return requestJson('/api/register-push-token', {
    method: 'POST',
    authMode: 'both',
    body,
  });
}

export async function fetchAdminUsers() {
  return requestJson<{ ok: true; users: AuthUser[] }>('/api/admin/users', { authMode: 'jwt' });
}

export async function createAdminUser(payload: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'owner';
  active?: boolean;
}) {
  return requestJson<{ ok: true; user: AuthUser }>('/api/admin/users', {
    method: 'POST',
    authMode: 'jwt',
    body: payload,
  });
}

export async function updateAdminUser(
  userId: string,
  payload: Partial<{ name: string; password: string; role: 'admin' | 'owner'; active: boolean }>
) {
  return requestJson<{ ok: true; user: AuthUser }>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    authMode: 'jwt',
    body: payload,
  });
}

export async function fetchAdminRequestLogs() {
  return requestJson<{ ok: true; items: Array<any> }>('/api/admin/logs/requests?limit=50', { authMode: 'jwt' });
}

export async function fetchAdminAuditLogs() {
  return requestJson<{ ok: true; items: Array<any> }>('/api/admin/logs/audit?limit=50', { authMode: 'jwt' });
}

export async function fetchAdminErrorLogs() {
  return requestJson<{ ok: true; items: Array<any> }>('/api/admin/logs/errors?limit=50', { authMode: 'jwt' });
}
