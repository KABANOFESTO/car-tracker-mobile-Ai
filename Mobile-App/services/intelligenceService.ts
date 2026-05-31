import {
  GeofencePrediction,
  GeofenceZone,
  OwnerRecommendation,
  TripReplay,
  Vehicle,
  VehicleForecast,
  VehicleIntelligenceInsight,
  VehicleProtectionState,
} from '@/constants/types';
import { getVehicleReplaysBetween } from './tripService';

function metersBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toBucket(hour: number) {
  if (hour < 6) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function getLookbackDates(lastSeen: string) {
  const end = new Date(lastSeen);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    startDate: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    endDate: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
    currentDate: lastSeen.slice(0, 10),
  };
}

function getActiveZone(vehicle: Vehicle, zones: GeofenceZone[]) {
  const vehicleZones = zones.filter((zone) => zone.vehicleId === vehicle.id);
  if (vehicleZones.length === 0) return null;

  const timestamp = vehicle.lastSeen;
  const hour = new Date(timestamp).getHours();
  const eligible = vehicleZones.filter((zone) => {
    if (zone.activeFromHour == null || zone.activeToHour == null) return true;
    if (zone.activeFromHour <= zone.activeToHour) {
      return hour >= zone.activeFromHour && hour < zone.activeToHour;
    }
    return hour >= zone.activeFromHour || hour < zone.activeToHour;
  });

  const preferred = eligible[0] ?? vehicleZones[0];
  return preferred;
}

function estimateStops(points: TripReplay['points']) {
  if (points.length < 2) return 0;
  let stopCount = 0;
  let stationaryRun = 0;

  for (const point of points) {
    if (point.speed <= 3) stationaryRun++;
    else stationaryRun = 0;

    if (stationaryRun === 3) stopCount++;
  }

  return stopCount;
}

function buildForecast(history: TripReplay[]): VehicleForecast {
  const startHours = history.map((trip) => new Date(trip.startTime).getHours());
  const expectedDistanceKm = Math.round(mean(history.map((trip) => trip.distanceKm)) * 10) / 10;
  const likelyActiveWindow = startHours.length > 0 ? toBucket(Math.round(mean(startHours))) : 'No pattern yet';
  const confidence = clamp(Math.round((history.length / 7) * 100), 20, 95);
  return { likelyActiveWindow, expectedDistanceKm, confidence };
}

function buildGeofencePrediction(
  vehicle: Vehicle,
  activeZone: GeofenceZone | null,
  currentReplay: TripReplay | null
): GeofencePrediction {
  if (!activeZone) {
    return {
      riskLevel: 'info',
      breachProbability: 0.15,
      estimatedMinutesToBreach: null,
    };
  }

  const distanceFromCenter = metersBetween(
    vehicle.location.latitude,
    vehicle.location.longitude,
    activeZone.latitude,
    activeZone.longitude
  );
  const boundaryGapMeters = activeZone.radius - distanceFromCenter;

  if (boundaryGapMeters <= 0) {
    return {
      riskLevel: 'critical',
      breachProbability: 0.99,
      estimatedMinutesToBreach: 0,
      monitoredZoneName: activeZone.name,
    };
  }

  const previousPoint = currentReplay && currentReplay.points.length > 1
    ? currentReplay.points[currentReplay.points.length - 2]
    : null;

  const previousDistance = previousPoint
    ? metersBetween(previousPoint.latitude, previousPoint.longitude, activeZone.latitude, activeZone.longitude)
    : distanceFromCenter;
  const movingOutward = distanceFromCenter > previousDistance + 5;

  const proximityScore = clamp(1 - boundaryGapMeters / 250, 0, 1);
  const speedScore = clamp(vehicle.speed / 60, 0, 1);
  const directionScore = movingOutward ? 1 : 0.35;
  const breachProbability = clamp(0.15 + proximityScore * 0.45 + speedScore * 0.2 + directionScore * 0.2, 0, 0.98);

  const estimatedMinutesToBreach =
    vehicle.speed > 5 && movingOutward
      ? Math.max(1, Math.round(((boundaryGapMeters / 1000) / vehicle.speed) * 60))
      : null;

  return {
    riskLevel: breachProbability >= 0.75 ? 'warning' : 'info',
    breachProbability: Math.round(breachProbability * 100) / 100,
    estimatedMinutesToBreach,
    monitoredZoneName: activeZone.name,
  };
}

function buildRecommendations(
  vehicle: Vehicle,
  suspiciousReasons: string[],
  tripRiskScore: number,
  geofencePrediction: GeofencePrediction,
  protection: VehicleProtectionState | undefined
): OwnerRecommendation[] {
  const recommendations: OwnerRecommendation[] = [];

  if (tripRiskScore >= 70) {
    recommendations.push({
      id: `${vehicle.id}-call-driver`,
      vehicleId: vehicle.id,
      title: 'Investigate this vehicle immediately',
      action: 'Call the driver and review the latest replay before allowing more trips.',
      priority: 'high',
    });
  }

  if (!protection?.armed && (new Date(vehicle.lastSeen).getHours() >= 21 || new Date(vehicle.lastSeen).getHours() <= 5)) {
    recommendations.push({
      id: `${vehicle.id}-arm-protection`,
      vehicleId: vehicle.id,
      title: 'Arm protection mode overnight',
      action: 'Enable anti-theft protection for this vehicle during parked hours.',
      priority: 'medium',
    });
  }

  if (geofencePrediction.breachProbability >= 0.7) {
    recommendations.push({
      id: `${vehicle.id}-geofence-watch`,
      vehicleId: vehicle.id,
      title: 'Watch geofence boundary closely',
      action: 'Vehicle is trending toward the boundary. Notify the driver before a breach occurs.',
      priority: 'high',
    });
  }

  if (suspiciousReasons.some((reason) => reason.includes('overspeed'))) {
    recommendations.push({
      id: `${vehicle.id}-speed-policy`,
      vehicleId: vehicle.id,
      title: 'Review speed discipline',
      action: 'Discuss recent speed spikes and consider lowering the response threshold for this driver.',
      priority: 'medium',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: `${vehicle.id}-healthy`,
      vehicleId: vehicle.id,
      title: 'Maintain current monitoring',
      action: 'Vehicle behavior is within its usual pattern. Continue standard supervision.',
      priority: 'low',
    });
  }

  return recommendations.slice(0, 3);
}

function summarizeIntelligence(
  vehicle: Vehicle,
  suspiciousReasons: string[],
  geofencePrediction: GeofencePrediction,
  forecast: VehicleForecast
) {
  const liveSummary = suspiciousReasons.length > 0
    ? `${vehicle.name} is showing ${suspiciousReasons[0].toLowerCase()}.`
    : `${vehicle.name} is operating within its normal pattern.`;

  const geofenceClause = geofencePrediction.estimatedMinutesToBreach != null
    ? ` It could breach ${geofencePrediction.monitoredZoneName ?? 'its zone'} in about ${geofencePrediction.estimatedMinutesToBreach} minute${geofencePrediction.estimatedMinutesToBreach === 1 ? '' : 's'}.`
    : '';

  const aiSummary = suspiciousReasons.length > 0
    ? `${vehicle.name} was flagged for ${suspiciousReasons.join(', ').toLowerCase()}.${geofenceClause} The model expects its next normal activity window to be ${forecast.likelyActiveWindow.toLowerCase()}.`
    : `${vehicle.name} shows stable behavior. The model expects its next typical activity window to be ${forecast.likelyActiveWindow.toLowerCase()} with around ${forecast.expectedDistanceKm.toFixed(1)} km of travel.`;

  return { liveSummary, aiSummary };
}

async function buildInsight(
  vehicle: Vehicle,
  zones: GeofenceZone[],
  protectionStates: VehicleProtectionState[]
): Promise<VehicleIntelligenceInsight> {
  const activeZone = getActiveZone(vehicle, zones);
  const protection = protectionStates.find((state) => state.vehicleId === vehicle.id);
  const { startDate, endDate, currentDate } = getLookbackDates(vehicle.lastSeen);
  const recentReplays = await getVehicleReplaysBetween(vehicle.id, startDate, endDate);
  const currentReplay = recentReplays.find((trip) => trip.date === currentDate) ?? null;
  const historical = recentReplays.filter((trip) => trip.date !== currentDate);

  const averageDistance = mean(historical.map((trip) => trip.distanceKm));
  const averageDuration = mean(historical.map((trip) => trip.durationMinutes));
  const averageStartHour = mean(historical.map((trip) => new Date(trip.startTime).getHours()));
  const stopCount = currentReplay ? estimateStops(currentReplay.points) : 0;
  const overspeedMoments = currentReplay ? currentReplay.points.filter((point) => point.speed >= 80).length : 0;
  const startHour = currentReplay ? new Date(currentReplay.startTime).getHours() : new Date(vehicle.lastSeen).getHours();

  const suspiciousReasons: string[] = [];
  let suspiciousMovementScore = 5;

  if (protection?.armed && vehicle.status === 'moving') {
    suspiciousReasons.push('movement while protection mode is armed');
    suspiciousMovementScore += 35;
  }
  if ((startHour >= 21 || startHour <= 5) && vehicle.status === 'moving') {
    suspiciousReasons.push('night movement');
    suspiciousMovementScore += 22;
  }
  if (vehicle.isOutsideFence) {
    suspiciousReasons.push('geofence breach');
    suspiciousMovementScore += 20;
  }
  if (overspeedMoments >= 2) {
    suspiciousReasons.push('overspeed pattern');
    suspiciousMovementScore += 10;
  }
  if (currentReplay && averageDistance > 0 && currentReplay.distanceKm > averageDistance * 1.8) {
    suspiciousReasons.push('unexpected long trip');
    suspiciousMovementScore += 14;
  }
  if (currentReplay && historical.length >= 3 && Math.abs(startHour - averageStartHour) >= 5) {
    suspiciousReasons.push('unusual trip timing');
    suspiciousMovementScore += 12;
  }

  suspiciousMovementScore = clamp(Math.round(suspiciousMovementScore), 0, 100);

  const distanceDeviation = currentReplay && averageDistance > 0 ? currentReplay.distanceKm / averageDistance : 1;
  const durationDeviation = currentReplay && averageDuration > 0 ? currentReplay.durationMinutes / averageDuration : 1;
  const anomalyScore = clamp(
    Math.round(
      (distanceDeviation > 1 ? (distanceDeviation - 1) * 28 : 0) +
      (durationDeviation > 1 ? (durationDeviation - 1) * 20 : 0) +
      (currentReplay?.outsideFenceMoments ?? 0) * 4 +
      Math.max(0, overspeedMoments - 1) * 6
    ),
    0,
    100
  );

  const driverPatternScore = clamp(
    Math.round(
      overspeedMoments * 8 +
      stopCount * 3 +
      (currentReplay?.outsideFenceMoments ?? 0) * 5 +
      (currentReplay && currentReplay.maxSpeed > 95 ? 18 : 0)
    ),
    0,
    100
  );

  const geofencePrediction = buildGeofencePrediction(vehicle, activeZone, currentReplay);
  const forecast = buildForecast(historical.length > 0 ? historical : recentReplays);
  const tripRiskScore = clamp(
    Math.round(suspiciousMovementScore * 0.45 + anomalyScore * 0.3 + driverPatternScore * 0.25),
    0,
    100
  );

  const predictiveAlert =
    tripRiskScore >= 70
      ? `${vehicle.name} is trending toward a high-risk trip.`
      : geofencePrediction.breachProbability >= 0.7
        ? `${vehicle.name} is likely to leave ${geofencePrediction.monitoredZoneName ?? 'its assigned area'} soon.`
        : undefined;

  const recommendations = buildRecommendations(vehicle, suspiciousReasons, tripRiskScore, geofencePrediction, protection);
  const summaries = summarizeIntelligence(vehicle, suspiciousReasons, geofencePrediction, forecast);

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    suspiciousMovementScore,
    tripRiskScore,
    anomalyScore,
    driverPatternScore,
    liveSummary: summaries.liveSummary,
    aiSummary: summaries.aiSummary,
    suspiciousReasons,
    predictiveAlert,
    geofencePrediction,
    forecast,
    recommendations,
  };
}

export async function buildFleetIntelligence(
  vehicles: Vehicle[],
  zones: GeofenceZone[],
  protectionStates: VehicleProtectionState[]
): Promise<VehicleIntelligenceInsight[]> {
  const eligibleVehicles = vehicles.filter((vehicle) => vehicle.lastSeen !== new Date(0).toISOString());
  const insights = await Promise.all(
    eligibleVehicles.map((vehicle) => buildInsight(vehicle, zones, protectionStates))
  );

  return insights.sort((left, right) => right.tripRiskScore - left.tripRiskScore);
}
