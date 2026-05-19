export type VehicleType = 'Car' | 'Truck' | 'Van' | 'Motorcycle' | 'Bus' | 'Other';
export type VehicleStatus = 'moving' | 'idle' | 'offline';
export type GeofenceZoneType = 'home' | 'parking' | 'work' | 'restricted';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'geofence' | 'security' | 'offline' | 'driving' | 'system';

export interface Vehicle {
  id: string;
  name: string;
  channelId: number;
  readApiKey: string;
  type: VehicleType;
  licensePlate: string;
  driver?: string;
  status: VehicleStatus;
  speed: number;
  location: { latitude: number; longitude: number };
  direction: number;
  altitude: number;
  satellites: number;
  hdop: number;
  isOutsideFence: boolean;
  lastSeen: string;
}

export interface PersistedVehicle {
  id: string;
  name: string;
  channelId: number;
  readApiKey: string;
  type: VehicleType;
  licensePlate: string;
  driver?: string;
}

export interface GeofenceConfig {
  geofenceLat: number;
  geofenceLng: number;
  radius: number;
  moveThreshold: number;
  speedThreshold: number;
  uploadInterval: number;
}

export interface GeofenceZone {
  id: string;
  vehicleId: string;
  name: string;
  type: GeofenceZoneType;
  latitude: number;
  longitude: number;
  radius: number;
  activeFromHour?: number | null;
  activeToHour?: number | null;
}

export interface VehicleProtectionState {
  vehicleId: string;
  armed: boolean;
  armedAt?: string | null;
}

export interface TripPoint {
  id: string;
  vehicleId: string;
  vehicleName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  direction: number;
  altitude: number;
  satellites: number;
  hdop: number;
  isOutsideFence: boolean;
}

export interface TripReplay {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  distanceKm: number;
  maxSpeed: number;
  averageSpeed: number;
  outsideFenceMoments: number;
  points: TripPoint[];
}

export interface FeedSummary {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: string;
  entryCount: number;
  maxSpeed: number;
  estimatedDistanceKm: number;
  durationMinutes: number;
  avgHdop: number;
  fenceBreachCount: number;
}

export interface FeedStats {
  totalDistanceKm: number;
  maxSpeedKmh: number;
  dayCount: number;
  fenceBreachDays: number;
  distanceChange: number;
}

export interface DriverInsight {
  vehicleId: string;
  vehicleName: string;
  driverName: string;
  totalDistanceKm: number;
  activeMinutes: number;
  idleMinutesEstimate: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  overspeedEvents: number;
  nightTrips: number;
  geofenceBreaches: number;
  riskScore: number;
}

export interface AlertEvent {
  id: string;
  vehicleId: string;
  vehicleName: string;
  timestamp: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  acknowledged: boolean;
  relatedZoneName?: string;
}

export interface VehicleStats {
  total: number;
  moving: number;
  idle: number;
  offline: number;
  fenceBreachCount: number;
}
