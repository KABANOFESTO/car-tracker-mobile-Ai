import { PersistedVehicle, Vehicle, VehicleStatus } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_THINGSPEAK_BASE_URL ?? "https://api.thingspeak.com";
const POLL_INTERVAL = Number(process.env.EXPO_PUBLIC_THINGSPEAK_POLL_INTERVAL_MS ?? "15000");
const STORAGE_KEY = "fleetpulse:vehicles";
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Module-level state
let vehicleList: Vehicle[] = [];
let speedThreshold = 5; // km/h — updated by setSpeedThreshold()
const subscribers = new Set<(vehicles: Vehicle[]) => void>();
let pollInterval: ReturnType<typeof setInterval> | null = null;
let initialized = false;

// ─── ThingSpeak feed shapes ───────────────────────────────────────────────────

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null; // latitude
  field2: string | null; // longitude
  field3: string | null; // speed km/h
  field4: string | null; // direction degrees
  field5: string | null; // altitude m
  field6: string | null; // satellites
  field7: string | null; // HDOP
  field8: string | null; // outside fence? '1' = yes
}

interface ThingSpeakResponse {
  channel: { id: number; [key: string]: unknown };
  feeds: ThingSpeakFeed[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveStatus(speed: number, lastSeen: string): VehicleStatus {
  const ageMs = Date.now() - new Date(lastSeen).getTime();
  if (ageMs > OFFLINE_THRESHOLD_MS) return "offline";
  return speed > speedThreshold ? "moving" : "idle";
}

function parseFeed(feed: ThingSpeakFeed, existing: Vehicle): Partial<Vehicle> {
  const lat = parseFloat(feed.field1 ?? "");
  const lng = parseFloat(feed.field2 ?? "");
  const speed = parseFloat(feed.field3 ?? "0") || 0;
  const direction = parseFloat(feed.field4 ?? "0") || 0;
  const altitude = parseFloat(feed.field5 ?? "0") || 0;
  const satellites = parseInt(feed.field6 ?? "0", 10) || 0;
  const hdop = parseFloat(feed.field7 ?? "99") || 99;
  const isOutsideFence = feed.field8 === "1";
  const lastSeen = feed.created_at;

  return {
    location: isNaN(lat) || isNaN(lng) ? existing.location : { latitude: lat, longitude: lng },
    speed,
    direction,
    altitude,
    satellites,
    hdop,
    isOutsideFence,
    lastSeen,
    status: deriveStatus(speed, lastSeen)
  };
}

function offlineDefaults(persisted: PersistedVehicle): Vehicle {
  return {
    ...persisted,
    status: "offline",
    speed: 0,
    location: { latitude: 0, longitude: 0 },
    direction: 0,
    altitude: 0,
    satellites: 0,
    hdop: 99,
    isOutsideFence: false,
    lastSeen: new Date(0).toISOString()
  };
}

function notify() {
  const snapshot = [...vehicleList];
  subscribers.forEach((cb) => cb(snapshot));
}

// ─── Polling ──────────────────────────────────────────────────────────────────

async function fetchVehicleTelemetry(vehicle: Vehicle): Promise<Partial<Vehicle>> {
  const url = `${BASE_URL}/channels/${vehicle.channelId}/feeds.json?api_key=${vehicle.readApiKey}&results=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ThingSpeak ${res.status}`);
  const data: ThingSpeakResponse = await res.json();
  if (!data.feeds || data.feeds.length === 0) throw new Error("No feeds");
  return parseFeed(data.feeds[0], vehicle);
}

async function pollAll() {
  let changed = false;
  await Promise.all(
    vehicleList.map(async (v, i) => {
      try {
        const update = await fetchVehicleTelemetry(v);

        vehicleList[i] = { ...v, ...update };
        changed = true;
      } catch {
        // Keep existing telemetry; mark offline if stale
        const ageMs = Date.now() - new Date(v.lastSeen).getTime();
        if (ageMs > OFFLINE_THRESHOLD_MS && v.status !== "offline") {
          vehicleList[i] = { ...v, status: "offline" };
          changed = true;
        }
      }
    })
  );
  if (changed) notify();
}

async function initialize() {
  if (initialized) return;
  initialized = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const persisted: PersistedVehicle[] = JSON.parse(raw);
      vehicleList = persisted.map(offlineDefaults);
    }
  } catch {
    vehicleList = [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function setSpeedThreshold(threshold: number) {
  speedThreshold = threshold;
  // Re-derive status for all vehicles with current telemetry
  vehicleList = vehicleList.map((v) => ({
    ...v,
    status: deriveStatus(v.speed, v.lastSeen)
  }));
  notify();
}

export function subscribeVehicles(callback: (vehicles: Vehicle[]) => void): () => void {
  subscribers.add(callback);

  initialize().then(() => {
    callback([...vehicleList]);
    if (!pollInterval) {
      pollAll(); // immediate first poll
      pollInterval = setInterval(pollAll, POLL_INTERVAL);
    }
  });

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
      initialized = false;
    }
  };
}

export async function addVehicle(input: Omit<PersistedVehicle, "id">): Promise<Vehicle> {
  const newVehicle: PersistedVehicle = {
    ...input,
    id: `v${Date.now()}`
  };

  const persisted: PersistedVehicle[] = vehicleList.map((v) => ({
    id: v.id,
    name: v.name,
    channelId: v.channelId,
    readApiKey: v.readApiKey,
    type: v.type,
    licensePlate: v.licensePlate,
    driver: v.driver
  }));
  persisted.push(newVehicle);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

  const liveVehicle = offlineDefaults(newVehicle);
  vehicleList.push(liveVehicle);
  notify();

  // Immediately try to fetch telemetry for this vehicle
  try {
    const update = await fetchVehicleTelemetry(liveVehicle);
    const idx = vehicleList.findIndex((v) => v.id === liveVehicle.id);
    if (idx !== -1) {
      vehicleList[idx] = { ...liveVehicle, ...update };
      notify();
    }
  } catch {
    // Stays offline until next poll
  }

  return vehicleList.find((v) => v.id === liveVehicle.id) ?? liveVehicle;
}

export async function updateVehicle(id: string, changes: Partial<Omit<PersistedVehicle, "id">>): Promise<void> {
  const idx = vehicleList.findIndex((v) => v.id === id);
  if (idx === -1) throw new Error(`Vehicle ${id} not found`);
  vehicleList[idx] = { ...vehicleList[idx], ...changes };
  const persisted: PersistedVehicle[] = vehicleList.map((v) => ({
    id: v.id,
    name: v.name,
    channelId: v.channelId,
    readApiKey: v.readApiKey,
    type: v.type,
    licensePlate: v.licensePlate,
    driver: v.driver
  }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  notify();
}

export async function removeVehicle(id: string): Promise<void> {
  vehicleList = vehicleList.filter((v) => v.id !== id);
  const persisted: PersistedVehicle[] = vehicleList.map((v) => ({
    id: v.id,
    name: v.name,
    channelId: v.channelId,
    readApiKey: v.readApiKey,
    type: v.type,
    licensePlate: v.licensePlate,
    driver: v.driver
  }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  notify();
}
