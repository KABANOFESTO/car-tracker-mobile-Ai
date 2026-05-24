import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthSession, AuthUser } from '@/constants/types';
import { getStoredSession, persistSession } from '@/services/authSessionService';
import {
  backendIsConfigured,
  changeBackendPassword,
  fetchBackendFleetState,
  getBackendProfile,
  loginBackend,
  logoutBackend,
} from '@/services/backendApiService';
import { replaceVehicles } from '@/services/vehicleService';
import { replaceGeofenceZones, replaceProtectionStates } from '@/services/geofenceZoneService';
import { clearIncidentHistory } from '@/services/incidentHistoryService';

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  backendConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completePasswordChange: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function hydrateOwnerData() {
  if (!backendIsConfigured()) return;
  const response = await fetchBackendFleetState();
  const state = Array.isArray(response.state) ? null : response.state;
  if (!state) return;

  await replaceVehicles(
    (state.vehicles || []).map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      channelId: vehicle.channelId,
      readApiKey: vehicle.readApiKey,
      type: vehicle.type as any,
      licensePlate: vehicle.licensePlate,
      driver: vehicle.driver,
    }))
  );
  await replaceGeofenceZones((state.zones || []) as any);
  await replaceProtectionStates((state.protectionStates || []) as any);
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = await getStoredSession();
        if (!stored) {
          if (!cancelled) setSession(null);
          return;
        }
        const profile = await getBackendProfile();
        const nextSession = { ...stored, user: profile };
        await persistSession(nextSession);
        await hydrateOwnerData();
        if (!cancelled) setSession(nextSession);
      } catch {
        await persistSession(null);
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const nextSession = await loginBackend(email, password);
    await hydrateOwnerData();
    setSession(nextSession);
  }

  async function signOut() {
    await logoutBackend(session?.refreshToken);
    await Promise.all([
      replaceVehicles([]),
      replaceGeofenceZones([]),
      replaceProtectionStates([]),
      clearIncidentHistory(),
    ]);
    setSession(null);
  }

  async function refreshProfile() {
    if (!backendIsConfigured()) return;
    const profile = await getBackendProfile();
    if (!session) return;
    const nextSession = { ...session, user: profile };
    await persistSession(nextSession);
    setSession(nextSession);
  }

  async function completePasswordChange(currentPassword: string, newPassword: string) {
    await changeBackendPassword(currentPassword, newPassword);
    const stored = await getStoredSession();
    if (stored) {
      setSession(stored);
      return;
    }
    await refreshProfile();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      backendConfigured: backendIsConfigured(),
      signIn,
      signOut,
      completePasswordChange,
      refreshProfile,
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return context;
}
