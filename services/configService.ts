import { GeofenceConfig } from '@/constants/types';

const BASE_URL = process.env.EXPO_PUBLIC_THINGSPEAK_BASE_URL ?? 'https://api.thingspeak.com';
const CONFIG_CHANNEL_ID = process.env.EXPO_PUBLIC_THINGSPEAK_CONFIG_CHANNEL_ID ?? '';
const CONFIG_READ_API_KEY = process.env.EXPO_PUBLIC_THINGSPEAK_CONFIG_READ_API_KEY ?? '';
const CONFIG_WRITE_API_KEY = process.env.EXPO_PUBLIC_THINGSPEAK_CONFIG_WRITE_API_KEY ?? '';

// ─── Module-level shared state ────────────────────────────────────────────────
// All useGeofenceConfig() instances share this so a save on the Geofence tab
// is immediately reflected on the Fleet and Map tabs without re-fetching.

type ConfigCallback = (config: GeofenceConfig) => void;
let cachedConfig: GeofenceConfig | null = null;
const subscribers = new Set<ConfigCallback>();

function notify(config: GeofenceConfig) {
  cachedConfig = config;
  subscribers.forEach(cb => cb(config));
}

/** Subscribe to config updates. Fires immediately with the cached value if one exists. */
export function subscribeConfig(cb: ConfigCallback): () => void {
  subscribers.add(cb);
  if (cachedConfig) cb(cachedConfig);
  return () => { subscribers.delete(cb); };
}

// ─── ThingSpeak helpers ───────────────────────────────────────────────────────

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null; // geofenceLat
  field2: string | null; // geofenceLng
  field3: string | null; // radius (metres)
  field4: string | null; // moveThreshold (metres)
  field5: string | null; // speedThreshold (km/h)
  field6: string | null; // uploadInterval (ms)
}

function parseFeed(feed: ThingSpeakFeed): GeofenceConfig {
  return {
    geofenceLat:    parseFloat(feed.field1 ?? '0') || 0,
    geofenceLng:    parseFloat(feed.field2 ?? '0') || 0,
    radius:         parseFloat(feed.field3 ?? '50') || 50,
    moveThreshold:  parseFloat(feed.field4 ?? '10') || 10,
    speedThreshold: parseFloat(feed.field5 ?? '5')  || 5,
    uploadInterval: parseFloat(feed.field6 ?? '30000') || 30000,
  };
}

export async function getGeofenceConfig(): Promise<GeofenceConfig> {
  const url = `${BASE_URL}/channels/${CONFIG_CHANNEL_ID}/feeds.json?api_key=${CONFIG_READ_API_KEY}&results=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
  const data = await res.json();
  const feed: ThingSpeakFeed | undefined = data.feeds?.[0];
  if (!feed) throw new Error('No config data in channel');
  const config = parseFeed(feed);
  notify(config);
  return config;
}

export async function updateGeofenceConfig(
  partial: Partial<GeofenceConfig>
): Promise<GeofenceConfig> {
  // Use cached config if available to avoid an extra fetch round-trip
  const current = cachedConfig ?? await getGeofenceConfig();
  const merged: GeofenceConfig = { ...current, ...partial };

  const params = new URLSearchParams({
    api_key: CONFIG_WRITE_API_KEY,
    field1: String(merged.geofenceLat),
    field2: String(merged.geofenceLng),
    field3: String(merged.radius),
    field4: String(merged.moveThreshold),
    field5: String(merged.speedThreshold),
    field6: String(merged.uploadInterval),
  });

  const url = `${BASE_URL}/update?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Config update failed: ${res.status}`);
  const entryId = (await res.text()).trim();
  if (entryId === '0') throw new Error('ThingSpeak rejected the update — check write API key or rate limit');

  // Broadcast the new config to all subscribers (Fleet + Map tabs update immediately)
  notify(merged);
  return merged;
}
