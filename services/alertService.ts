import { AlertEvent, GeofenceZone, TripReplay, Vehicle, VehicleProtectionState } from '@/constants/types';
import { getTripReplay } from './tripService';

function isWithinZoneHour(zone: GeofenceZone, timestamp: string) {
  if (zone.activeFromHour == null || zone.activeToHour == null) return true;
  const hour = new Date(timestamp).getHours();
  if (zone.activeFromHour <= zone.activeToHour) {
    return hour >= zone.activeFromHour && hour < zone.activeToHour;
  }
  return hour >= zone.activeFromHour || hour < zone.activeToHour;
}

function createId(parts: string[]) {
  return parts.join(':').replace(/\s+/g, '-').toLowerCase();
}

function liveAlerts(
  vehicles: Vehicle[],
  protectionStates: VehicleProtectionState[],
  zones: GeofenceZone[]
): AlertEvent[] {
  const now = Date.now();
  const alerts: AlertEvent[] = [];

  for (const vehicle of vehicles) {
    const protection = protectionStates.find((state) => state.vehicleId === vehicle.id);
    const vehicleZones = zones.filter((zone) => zone.vehicleId === vehicle.id);
    const activeHomeOrParkingZone = vehicleZones.find(
      (zone) => (zone.type === 'home' || zone.type === 'parking') && isWithinZoneHour(zone, vehicle.lastSeen)
    );
    const ageMinutes = Math.round((now - new Date(vehicle.lastSeen).getTime()) / 60000);

    if (vehicle.isOutsideFence) {
      alerts.push({
        id: createId([vehicle.id, vehicle.lastSeen, 'geofence']),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: vehicle.lastSeen,
        title: 'Vehicle outside assigned zone',
        description: `${vehicle.name} is currently outside the configured operating area.`,
        severity: 'warning',
        category: 'geofence',
        acknowledged: false,
        relatedZoneName: activeHomeOrParkingZone?.name,
      });
    }

    if (vehicle.status === 'offline' && ageMinutes >= 10) {
      alerts.push({
        id: createId([vehicle.id, vehicle.lastSeen, 'offline']),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: vehicle.lastSeen,
        title: 'Vehicle connection lost',
        description: `${vehicle.name} has not reported in for ${ageMinutes} minutes.`,
        severity: ageMinutes >= 30 ? 'critical' : 'warning',
        category: 'offline',
        acknowledged: false,
      });
    }

    if (protection?.armed && vehicle.status === 'moving') {
      alerts.push({
        id: createId([vehicle.id, vehicle.lastSeen, 'armed-move']),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: vehicle.lastSeen,
        title: 'Protected vehicle moved',
        description: `${vehicle.name} moved while vehicle protection mode was armed.`,
        severity: 'critical',
        category: 'security',
        acknowledged: false,
        relatedZoneName: activeHomeOrParkingZone?.name,
      });
    }
  }

  return alerts;
}

function replayAlerts(replay: TripReplay): AlertEvent[] {
  const alerts: AlertEvent[] = [];
  const startHour = new Date(replay.startTime).getHours();
  const overspeedEvents = replay.points.filter((point) => point.speed >= 80);

  if (startHour >= 21 || startHour <= 5) {
    alerts.push({
      id: createId([replay.vehicleId, replay.date, 'night-trip']),
      vehicleId: replay.vehicleId,
      vehicleName: replay.vehicleName,
      timestamp: replay.startTime,
      title: 'Night movement detected',
      description: `${replay.vehicleName} started a trip during protected hours.`,
      severity: 'warning',
      category: 'security',
      acknowledged: false,
    });
  }

  if (overspeedEvents.length > 0) {
    alerts.push({
      id: createId([replay.vehicleId, replay.date, 'overspeed']),
      vehicleId: replay.vehicleId,
      vehicleName: replay.vehicleName,
      timestamp: overspeedEvents[0].timestamp,
      title: 'Repeated overspeeding detected',
      description: `${replay.vehicleName} exceeded 80 km/h ${overspeedEvents.length} times during this trip.`,
      severity: overspeedEvents.length >= 4 ? 'critical' : 'warning',
      category: 'driving',
      acknowledged: false,
    });
  }

  if (replay.outsideFenceMoments > 0) {
    alerts.push({
      id: createId([replay.vehicleId, replay.date, 'trip-fence']),
      vehicleId: replay.vehicleId,
      vehicleName: replay.vehicleName,
      timestamp: replay.startTime,
      title: 'Trip left permitted area',
      description: `${replay.vehicleName} recorded ${replay.outsideFenceMoments} outside-fence moments on ${replay.date}.`,
      severity: 'warning',
      category: 'geofence',
      acknowledged: false,
    });
  }

  return alerts;
}

export async function buildAlertEvents(
  vehicles: Vehicle[],
  protectionStates: VehicleProtectionState[],
  zones: GeofenceZone[]
): Promise<AlertEvent[]> {
  const live = liveAlerts(vehicles, protectionStates, zones);

  const replayResults = await Promise.all(
    vehicles
      .filter((vehicle) => vehicle.lastSeen !== new Date(0).toISOString())
      .map((vehicle) => getTripReplay(vehicle.id, vehicle.lastSeen.slice(0, 10)))
  );

  const historical = replayResults
    .filter((replay): replay is TripReplay => replay !== null)
    .flatMap((replay) => replayAlerts(replay));

  return [...live, ...historical].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}
