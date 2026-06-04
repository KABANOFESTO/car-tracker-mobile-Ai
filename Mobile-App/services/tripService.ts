import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DriverInsight,
  FeedSummary,
  PersistedVehicle,
  TripPoint,
  TripReplay,
} from '@/constants/types';
import { buildReportCsv } from '@/services/reportExportService';

const BASE_URL = process.env.EXPO_PUBLIC_THINGSPEAK_BASE_URL ?? 'https://api.thingspeak.com';
const STORAGE_KEY = 'fleetpulse:vehicles';
const OVERSPEED_THRESHOLD_KMH = 80;

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
  field6: string | null;
  field7: string | null;
  field8: string | null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

async function loadVehicles(): Promise<PersistedVehicle[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PersistedVehicle[]) : [];
}

function formatDate(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

async function fetchFeeds(
  channelId: number,
  readApiKey: string,
  start: string,
  end: string,
  results = 8000
): Promise<ThingSpeakFeed[]> {
  const url = `${BASE_URL}/channels/${channelId}/feeds.json?api_key=${readApiKey}&start=${start}&end=${end}&results=${results}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ThingSpeak feeds ${res.status}`);
  const data = await res.json();
  return (data.feeds ?? []) as ThingSpeakFeed[];
}

function toTripPoints(feeds: ThingSpeakFeed[], vehicle: PersistedVehicle): TripPoint[] {
  return feeds
    .map((feed) => {
      const latitude = parseFloat(feed.field1 ?? '');
      const longitude = parseFloat(feed.field2 ?? '');
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

      return {
        id: `${vehicle.id}-${feed.entry_id}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: feed.created_at,
        latitude,
        longitude,
        speed: parseFloat(feed.field3 ?? '0') || 0,
        direction: parseFloat(feed.field4 ?? '0') || 0,
        altitude: parseFloat(feed.field5 ?? '0') || 0,
        satellites: parseInt(feed.field6 ?? '0', 10) || 0,
        hdop: parseFloat(feed.field7 ?? '99') || 99,
        isOutsideFence: feed.field8 === '1',
      } satisfies TripPoint;
    })
    .filter((point): point is TripPoint => point !== null);
}

function summarisePoints(points: TripPoint[], vehicleId: string, vehicleName: string, date: string): FeedSummary {
  let distanceKm = 0;
  let maxSpeed = 0;
  let speedSum = 0;
  let hdopSum = 0;
  let hdopCount = 0;
  let fenceBreachCount = 0;

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    speedSum += point.speed;
    maxSpeed = Math.max(maxSpeed, point.speed);
    if (point.hdop < 99) {
      hdopSum += point.hdop;
      hdopCount++;
    }
    if (point.isOutsideFence) fenceBreachCount++;

    if (index > 0) {
      const previous = points[index - 1];
      distanceKm += haversineKm(previous.latitude, previous.longitude, point.latitude, point.longitude);
    }
  }

  const first = new Date(points[0]?.timestamp ?? `${date}T00:00:00Z`).getTime();
  const last = new Date(points[points.length - 1]?.timestamp ?? `${date}T00:00:00Z`).getTime();
  const durationMinutes = Math.max(0, Math.round((last - first) / 60000));

  return {
    id: `${vehicleId}-${date}`,
    vehicleId,
    vehicleName,
    date,
    entryCount: points.length,
    maxSpeed: Math.round(maxSpeed * 10) / 10,
    averageSpeedKmh: points.length > 0 ? Math.round((speedSum / points.length) * 10) / 10 : 0,
    estimatedDistanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes,
    avgHdop: hdopCount > 0 ? Math.round((hdopSum / hdopCount) * 100) / 100 : 99,
    fenceBreachCount,
  };
}

function groupPointsByDay(points: TripPoint[]): Map<string, TripPoint[]> {
  const days = new Map<string, TripPoint[]>();
  for (const point of points) {
    const date = point.timestamp.slice(0, 10);
    if (!days.has(date)) days.set(date, []);
    days.get(date)!.push(point);
  }
  return days;
}

function buildReplay(vehicle: PersistedVehicle, date: string, points: TripPoint[]): TripReplay {
  let distanceKm = 0;
  let maxSpeed = 0;
  let speedSum = 0;
  let outsideFenceMoments = 0;

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    speedSum += point.speed;
    maxSpeed = Math.max(maxSpeed, point.speed);
    if (point.isOutsideFence) outsideFenceMoments++;
    if (index > 0) {
      const previous = points[index - 1];
      distanceKm += haversineKm(previous.latitude, previous.longitude, point.latitude, point.longitude);
    }
  }

  const startTime = points[0]?.timestamp ?? `${date}T00:00:00Z`;
  const endTime = points[points.length - 1]?.timestamp ?? startTime;
  const durationMinutes = Math.max(0, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000));

  return {
    id: `${vehicle.id}-${date}-replay`,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    date,
    startTime,
    endTime,
    durationMinutes,
    distanceKm: Math.round(distanceKm * 100) / 100,
    maxSpeed: Math.round(maxSpeed * 10) / 10,
    averageSpeed: points.length > 0 ? Math.round((speedSum / points.length) * 10) / 10 : 0,
    outsideFenceMoments,
    points,
  };
}

function calculateDriverInsight(vehicle: PersistedVehicle, summaries: FeedSummary[], replays: TripReplay[]): DriverInsight {
  const totalDistanceKm = summaries.reduce((sum, summary) => sum + summary.estimatedDistanceKm, 0);
  const activeMinutes = summaries.reduce((sum, summary) => sum + summary.durationMinutes, 0);
  const geofenceBreaches = summaries.reduce((sum, summary) => sum + summary.fenceBreachCount, 0);
  const maxSpeedKmh = summaries.reduce((sum, summary) => Math.max(sum, summary.maxSpeed), 0);
  const averageSpeedKmh = summaries.length > 0
    ? Math.round((summaries.reduce((sum, summary) => sum + summary.averageSpeedKmh, 0) / summaries.length) * 10) / 10
    : 0;
  const overspeedEvents = replays.reduce(
    (sum, replay) => sum + replay.points.filter((point) => point.speed >= OVERSPEED_THRESHOLD_KMH).length,
    0
  );
  const nightTrips = replays.filter((replay) => {
    const startHour = new Date(replay.startTime).getHours();
    return startHour >= 21 || startHour <= 5;
  }).length;
  const idleMinutesEstimate = Math.max(0, Math.round(activeMinutes * 0.2));

  const riskScore = Math.min(
    100,
    Math.round(
      geofenceBreaches * 10 +
      overspeedEvents * 2 +
      nightTrips * 12 +
      (maxSpeedKmh > 100 ? 10 : 0) +
      (totalDistanceKm > 800 ? 8 : 0)
    )
  );

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    driverName: vehicle.driver?.trim() || 'Unassigned',
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    activeMinutes,
    idleMinutesEstimate,
    averageSpeedKmh,
    maxSpeedKmh: Math.round(maxSpeedKmh * 10) / 10,
    overspeedEvents,
    nightTrips,
    geofenceBreaches,
    riskScore,
  };
}

export async function getVehicleFeedHistory(
  vehicleId: string | null,
  year: number,
  month: number
): Promise<FeedSummary[]> {
  const vehicles = await loadVehicles();
  const targets = vehicleId ? vehicles.filter((vehicle) => vehicle.id === vehicleId) : vehicles;
  if (targets.length === 0) return [];

  const lastDay = new Date(year, month, 0).getDate();
  const start = `${year}-${pad(month)}-01%2000:00:00`;
  const end = `${year}-${pad(month)}-${pad(lastDay)}%2023:59:59`;

  const results = await Promise.allSettled(
    targets.map(async (vehicle) => {
      const feeds = await fetchFeeds(vehicle.channelId, vehicle.readApiKey, start, end);
      const points = toTripPoints(feeds, vehicle);
      return Array.from(groupPointsByDay(points).entries()).map(([date, datePoints]) =>
        summarisePoints(datePoints, vehicle.id, vehicle.name, date)
      );
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<FeedSummary[]> => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getTripReplay(vehicleId: string, date: string): Promise<TripReplay | null> {
  const vehicles = await loadVehicles();
  const vehicle = vehicles.find((entry) => entry.id === vehicleId);
  if (!vehicle) return null;

  const start = `${date}%2000:00:00`;
  const end = `${date}%2023:59:59`;
  const feeds = await fetchFeeds(vehicle.channelId, vehicle.readApiKey, start, end, 2000);
  const points = toTripPoints(feeds, vehicle);
  if (points.length === 0) return null;
  return buildReplay(vehicle, date, points);
}

export async function getVehicleReplaysBetween(
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<TripReplay[]> {
  const vehicles = await loadVehicles();
  const vehicle = vehicles.find((entry) => entry.id === vehicleId);
  if (!vehicle) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const replays: TripReplay[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = formatDate(cursor);
    const replay = await getTripReplay(vehicleId, date);
    if (replay) replays.push(replay);
  }

  return replays;
}

export async function getDriverInsights(year: number, month: number): Promise<DriverInsight[]> {
  const vehicles = await loadVehicles();
  if (vehicles.length === 0) return [];

  const summaries = await getVehicleFeedHistory(null, year, month);

  const replays = await Promise.all(
    summaries.map((summary) => getTripReplay(summary.vehicleId, summary.date))
  );

  return vehicles
    .map((vehicle) => {
      const vehicleSummaries = summaries.filter((summary) => summary.vehicleId === vehicle.id);
      const vehicleReplays = replays.filter(
        (replay): replay is TripReplay => replay !== null && replay.vehicleId === vehicle.id
      );
      return calculateDriverInsight(vehicle, vehicleSummaries, vehicleReplays);
    })
    .sort((left, right) => right.riskScore - left.riskScore);
}

export async function exportFeedHistoryCsv(
  vehicleId: string | null,
  year: number,
  month: number
): Promise<string> {
  const summaries = await getVehicleFeedHistory(vehicleId, year, month);
  return buildReportCsv({
    summaries,
    periodLabel: `${year}-${String(month).padStart(2, '0')}`,
    scopeLabel: vehicleId ? 'Selected vehicle' : 'Fleet',
  });
}
