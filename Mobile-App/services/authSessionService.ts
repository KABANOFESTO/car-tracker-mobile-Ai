import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthSession } from '@/constants/types';

const SESSION_KEY = 'fleetpulse:auth-session';

export async function getStoredSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export async function persistSession(session: AuthSession | null): Promise<void> {
  if (!session) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
