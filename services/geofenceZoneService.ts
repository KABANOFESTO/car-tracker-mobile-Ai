import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeofenceZone, VehicleProtectionState } from '@/constants/types';

const ZONES_KEY = 'fleetpulse:geofence-zones';
const PROTECTION_KEY = 'fleetpulse:protection-states';

function sortZones(zones: GeofenceZone[]) {
  const order = { home: 0, parking: 1, work: 2, restricted: 3 } as const;
  return [...zones].sort((left, right) => order[left.type] - order[right.type] || left.name.localeCompare(right.name));
}

export async function getGeofenceZones(): Promise<GeofenceZone[]> {
  const raw = await AsyncStorage.getItem(ZONES_KEY);
  if (!raw) return [];
  return sortZones(JSON.parse(raw) as GeofenceZone[]);
}

export async function getVehicleZones(vehicleId: string): Promise<GeofenceZone[]> {
  const zones = await getGeofenceZones();
  return zones.filter((zone) => zone.vehicleId === vehicleId);
}

export async function saveVehicleZone(zone: Omit<GeofenceZone, 'id'> & { id?: string }): Promise<GeofenceZone[]> {
  const zones = await getGeofenceZones();
  const nextZone: GeofenceZone = {
    ...zone,
    id: zone.id ?? `zone-${Date.now()}`,
  };

  const existingIndex = zones.findIndex((entry) => entry.id === nextZone.id);
  if (existingIndex >= 0) zones[existingIndex] = nextZone;
  else zones.push(nextZone);

  const sorted = sortZones(zones);
  await AsyncStorage.setItem(ZONES_KEY, JSON.stringify(sorted));
  return sorted;
}

export async function deleteVehicleZone(zoneId: string): Promise<GeofenceZone[]> {
  const zones = await getGeofenceZones();
  const next = zones.filter((zone) => zone.id !== zoneId);
  await AsyncStorage.setItem(ZONES_KEY, JSON.stringify(next));
  return next;
}

export async function getProtectionStates(): Promise<VehicleProtectionState[]> {
  const raw = await AsyncStorage.getItem(PROTECTION_KEY);
  return raw ? (JSON.parse(raw) as VehicleProtectionState[]) : [];
}

export async function getVehicleProtectionState(vehicleId: string): Promise<VehicleProtectionState> {
  const states = await getProtectionStates();
  return states.find((state) => state.vehicleId === vehicleId) ?? { vehicleId, armed: false, armedAt: null };
}

export async function setVehicleProtectionState(
  vehicleId: string,
  armed: boolean
): Promise<VehicleProtectionState[]> {
  const states = await getProtectionStates();
  const nextState: VehicleProtectionState = {
    vehicleId,
    armed,
    armedAt: armed ? new Date().toISOString() : null,
  };

  const existingIndex = states.findIndex((entry) => entry.vehicleId === vehicleId);
  if (existingIndex >= 0) states[existingIndex] = nextState;
  else states.push(nextState);

  await AsyncStorage.setItem(PROTECTION_KEY, JSON.stringify(states));
  return states;
}
