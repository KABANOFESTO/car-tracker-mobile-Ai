import Constants from 'expo-constants';
import { Platform } from 'react-native';

const RAW_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.replace(/\/$/, '') ?? '';

function getExpoHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? null;
  if (!hostUri) return null;

  const [host] = hostUri.split(':');
  return host || null;
}

function resolveLocalBackendUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  try {
    const url = new URL(rawUrl);
    const expoHost = getExpoHost();
    const isLoopbackHost = ['127.0.0.1', 'localhost'].includes(url.hostname);

    if (!isLoopbackHost) return rawUrl;

    if (expoHost) {
      url.hostname = expoHost;
      return url.toString().replace(/\/$/, '');
    }

    if (Platform.OS === 'android') {
      url.hostname = '10.0.2.2';
      return url.toString().replace(/\/$/, '');
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export function getBackendBaseUrl() {
  return resolveLocalBackendUrl(RAW_BACKEND_BASE_URL);
}

export function backendIsConfigured() {
  return getBackendBaseUrl().length > 0;
}

export function getBackendConnectionHelp() {
  const resolvedBaseUrl = getBackendBaseUrl();
  const usingLoopbackAddress = /\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(RAW_BACKEND_BASE_URL);

  if (!RAW_BACKEND_BASE_URL) {
    return 'Set EXPO_PUBLIC_BACKEND_BASE_URL in .env before signing in.';
  }

  if (usingLoopbackAddress && resolvedBaseUrl === RAW_BACKEND_BASE_URL) {
    return `Cannot reach ${RAW_BACKEND_BASE_URL} from this device. Replace it with your computer's LAN IP, for example http://192.168.1.10:4000, then restart Expo.`;
  }

  return `Cannot reach backend at ${resolvedBaseUrl}. Make sure the backend server is running and this phone/emulator can access that address.`;
}

export function getBackendConfigSnapshot() {
  return {
    rawBaseUrl: RAW_BACKEND_BASE_URL,
    resolvedBaseUrl: getBackendBaseUrl(),
  };
}
