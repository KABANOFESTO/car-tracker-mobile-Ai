import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const VOICE_ENABLED_KEY = 'fleetpulse:voice-guidance-enabled';
const VOICE_RATE = 0.95;
const VOICE_PITCH = 1.0;

let speaking = false;
let lastSpokenKey: string | null = null;
let lastSpokenAt = 0;

function canSpeak() {
  return Platform.OS !== 'web';
}

export async function getVoiceGuidanceEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(VOICE_ENABLED_KEY);
  if (raw == null) return true;
  return raw === 'true';
}

export async function setVoiceGuidanceEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(VOICE_ENABLED_KEY, String(enabled));
}

export async function stopVoiceGuidance(): Promise<void> {
  if (!canSpeak()) return;
  const Speech = await import('expo-speech');
  Speech.stop();
  speaking = false;
}

async function speak(text: string, key?: string, priority = false) {
  if (!canSpeak()) return;
  const enabled = await getVoiceGuidanceEnabled();
  if (!enabled) return;

  const Speech = await import('expo-speech');
  const now = Date.now();
  if (!priority && key && lastSpokenKey === key && now - lastSpokenAt < 180000) {
    return;
  }

  if (speaking) {
    Speech.stop();
  }

  speaking = true;
  lastSpokenKey = key ?? null;
  lastSpokenAt = now;

  Speech.speak(text, {
    rate: VOICE_RATE,
    pitch: VOICE_PITCH,
    language: 'en-US',
    onDone: () => {
      speaking = false;
    },
    onStopped: () => {
      speaking = false;
    },
    onError: () => {
      speaking = false;
    },
  });
}

export async function announceAlertVoice(params: {
  title: string;
  vehicleName: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}) {
  const priority = params.severity === 'critical';
  const sentence =
    params.severity === 'critical'
      ? `Critical alert for ${params.vehicleName}. ${params.title}. ${params.description}`
      : `${params.title} for ${params.vehicleName}. ${params.description}`;
  await speak(sentence, `alert:${params.title}:${params.vehicleName}`, priority);
}

export async function announceVehicleFocus(params: {
  name: string;
  status: string;
  speed?: number;
  isOutsideFence?: boolean;
}) {
  const fenceText = params.isOutsideFence ? 'It is outside the geofence.' : '';
  const speedText = typeof params.speed === 'number' ? `Current speed is ${Math.round(params.speed)} kilometers per hour.` : '';
  const sentence = `${params.name} selected. Status is ${params.status}. ${speedText} ${fenceText}`.trim();
  await speak(sentence, `vehicle:${params.name}:${params.status}`, false);
}

export async function announceMapCenter(params: { latitude: number; longitude: number }) {
  const sentence = `Geofence center set at ${params.latitude.toFixed(5)} latitude, ${params.longitude.toFixed(5)} longitude.`;
  await speak(sentence, `center:${params.latitude.toFixed(4)}:${params.longitude.toFixed(4)}`, true);
}

export async function announceReplayPoint(params: {
  vehicleName: string;
  timestamp: string;
  speed: number;
  outsideFence: boolean;
}) {
  const sentence = `${params.vehicleName} replay point selected at ${new Date(params.timestamp).toLocaleTimeString()}. Speed ${Math.round(params.speed)} kilometers per hour.${params.outsideFence ? ' Outside the geofence.' : ''}`;
  await speak(sentence, `replay:${params.vehicleName}:${params.timestamp}`, false);
}

export async function announceVehicleStatus(params: {
  name: string;
  status: string;
  speed: number;
  outsideFence: boolean;
}) {
  const shouldSpeak = params.status === 'moving' || params.outsideFence;
  if (!shouldSpeak) return;
  await speak(
    `${params.name} is now ${params.status}. ${params.outsideFence ? 'The vehicle is outside the geofence.' : `Speed is ${Math.round(params.speed)} kilometers per hour.`}`,
    `status:${params.name}:${params.status}:${params.outsideFence}`,
  );
}
